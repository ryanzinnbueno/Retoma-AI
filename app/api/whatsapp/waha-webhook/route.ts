import { waitUntil } from 'cloudflare:workers';
import { db, load, commit, AppError } from '../../../server/store';
import { generate, mandatory } from '../../../server/gemini';
import { validateDecision } from '../../../server/decisions';
import { business } from '../../../business-model';
import {
  conversationalMessages,
  recordInterests,
} from '../../../conversation-tools';
import {
  sendWahaText,
  setWahaTyping,
  wahaOwner,
  wahaSession,
  wahaWebhookSecret,
} from '../../../server/waha';
import { terminal, type Lead } from '../../../recovery-model';

type WahaMessage = {
  id?: string;
  timestamp?: number;
  from?: string;
  to?: string;
  fromMe?: boolean;
  body?: string;
  hasMedia?: boolean;
  _data?: { notifyName?: string; pushName?: string };
};
type WahaEvent = { event?: string; session?: string; payload?: WahaMessage };
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function newLead(id: number, externalId: string, name: string): Lead {
  return {
    id,
    externalId,
    name,
    company: '',
    service: 'Conversa do WhatsApp',
    value: null,
    date: new Date().toISOString().slice(0, 10),
    status: 'Conversando',
    ai: true,
    consent: true,
    optOut: false,
    due: 'Aguardando cliente',
    attempts: 0,
    reason: '',
    needsHuman: false,
    notes: 'Conversa recebida pela conexão direta do WhatsApp.',
    messages: [],
    history: ['Conversa conectada automaticamente ao Retoma.'],
    interests: [],
    events: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        status: 'Conversando',
        value: null,
        confirmed: false,
      },
    ],
  };
}
function inboundText(message: WahaMessage) {
  const value = message.body?.trim();
  if (value) return value.slice(0, 6000);
  if (message.hasMedia) return '[Cliente enviou um arquivo de mídia.]';
  return '[Cliente enviou uma mensagem sem texto.]';
}
async function markDelivery(
  owner: string,
  leadId: number,
  messageId: string,
  delivery: 'sent' | 'failed',
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const snapshot = await load(owner),
      lead = snapshot.data.leads.find((item) => item.id === leadId);
    if (!lead) return;
    const message = lead.messages.find((item) => item.id === messageId);
    if (!message) return;
    message.delivery = delivery;
    try {
      await commit(owner, snapshot.revision, snapshot.data);
      return;
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 409 || attempt)
        throw error;
    }
  }
}
async function processMessage(
  owner: string,
  eventId: string,
  message: WahaMessage,
) {
  try {
    const chatId = (message.fromMe ? message.to : message.from) || '';
    if (!chatId || /@g\.us$|@newsletter$|status@broadcast$/.test(chatId))
      return;
    let snapshot = await load(owner),
      externalId = 'whatsapp-direct:' + chatId,
      lead = snapshot.data.leads.find((item) => item.externalId === externalId),
      text = inboundText(message),
      at = message.timestamp
        ? new Date(message.timestamp * 1000).toISOString()
        : new Date().toISOString();
    if (!lead) {
      if (message.fromMe) return;
      lead = newLead(
        Math.max(0, ...snapshot.data.leads.map((item) => item.id)) + 1,
        externalId,
        message._data?.notifyName ||
          message._data?.pushName ||
          `Cliente ${chatId.replace(/\D/g, '').slice(-4)}`,
      );
      snapshot.data.leads.push(lead);
    }
    if (lead.messages.some((item) => item.id === eventId)) return;
    if (message.fromMe) {
      const automated = lead.messages.some(
        (item) =>
          item.role === 'ia' &&
          item.text === text &&
          (item.delivery === 'pending' || item.delivery === 'sent'),
      );
      if (automated) return;
      lead = {
        ...lead,
        ai: false,
        needsHuman: false,
        due: 'Atendimento manual',
        messages: [
          ...lead.messages,
          {
            id: eventId,
            role: 'vendedor',
            text,
            createdAt: at,
            delivery: 'sent',
          },
        ],
        history: [
          ...lead.history,
          'Vendedor respondeu no WhatsApp. A IA foi pausada automaticamente.',
        ],
      };
      snapshot.data.leads = snapshot.data.leads.map((item) =>
        item.id === lead!.id ? lead! : item,
      );
      await commit(owner, snapshot.revision, snapshot.data);
      return;
    }
    lead = {
      ...lead,
      status: 'Conversando',
      messages: [
        ...lead.messages,
        {
          id: eventId,
          role: 'cliente',
          text,
          createdAt: at,
          delivery: 'received',
        },
      ],
    };
    lead.interests = recordInterests(
      lead,
      snapshot.data.config,
      text,
      eventId,
      at,
    );
    snapshot.data.leads = snapshot.data.leads.map((item) =>
      item.id === lead!.id ? lead! : item,
    );
    snapshot = await commit(owner, snapshot.revision, snapshot.data);
    if (
      !lead.ai ||
      lead.optOut ||
      terminal(lead) ||
      business(snapshot.data.config).paused
    )
      return;
    await setWahaTyping(chatId, true).catch(() => {});
    const forced = mandatory(text),
      decision =
        forced ||
        validateDecision(
          snapshot.data.config,
          lead,
          text,
          await generate(snapshot.data.config, lead, text, 'reply'),
        );
    const latest = await load(owner),
      current = latest.data.leads.find((item) => item.id === lead!.id);
    if (!current || !current.ai || business(latest.data.config).paused) return;
    const stop = decision.action === 'stop',
      needsHuman =
        !stop && (current.needsHuman || decision.action === 'handoff'),
      replyId = eventId + '-reply',
      next: Lead = {
        ...current,
        status: stop ? 'Encerrado' : 'Conversando',
        ai: !stop,
        optOut: stop,
        needsHuman,
        recoveryPaused: stop || needsHuman,
        reason: current.needsHuman
          ? current.reason
          : needsHuman
            ? decision.reason
            : '',
        aiSummary: needsHuman
          ? `${decision.summary}\nPendência para o vendedor: ${decision.reason}`.slice(
              0,
              4000,
            )
          : decision.summary,
        due: stop
          ? 'Não contatar'
          : needsHuman
            ? 'Ação do vendedor · IA disponível'
            : 'Enviando resposta',
        messages: [
          ...current.messages,
          {
            id: replyId,
            role: 'ia',
            text: decision.text,
            createdAt: new Date().toISOString(),
            provider: decision.provider,
            delivery: 'pending',
            action: decision.action,
            references: decision.references,
          },
        ],
        history: [
          ...current.history,
          stop
            ? 'Recusa registrada pelo WhatsApp.'
            : needsHuman
              ? 'Vendedor alertado; a IA segue disponível até ele assumir.'
              : 'Resposta preparada para envio pelo WhatsApp.',
        ],
      };
    latest.data.leads = latest.data.leads.map((item) =>
      item.id === next.id ? next : item,
    );
    await commit(owner, latest.revision, latest.data);
    try {
      const parts = conversationalMessages(decision.text);
      for (let index = 0; index < parts.length; index++) {
        await setWahaTyping(chatId, true).catch(() => {});
        if (index) await delay(Math.min(1800, 650 + parts[index].length * 7));
        await sendWahaText(chatId, parts[index]);
      }
      await setWahaTyping(chatId, false).catch(() => {});
      await markDelivery(owner, next.id, replyId, 'sent');
    } catch (error) {
      await setWahaTyping(chatId, false).catch(() => {});
      await markDelivery(owner, next.id, replyId, 'failed').catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error(
      'WAHA processing failed',
      error instanceof Error ? error.message : 'unknown',
    );
    await db()
      .prepare(
        "UPDATE events SET status='failed',result=? WHERE owner=? AND id=?",
      )
      .bind(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Falha interna.',
        }),
        owner,
        eventId,
      )
      .run()
      .catch(() => {});
  }
}

export async function POST(req: Request) {
  try {
    if (req.headers.get('x-retoma-webhook-secret') !== wahaWebhookSecret())
      return new Response('Não autorizado.', { status: 401 });
    const body = (await req.json()) as WahaEvent;
    if (body.session !== wahaSession())
      return Response.json({ received: true });
    if (body.event !== 'message.any' || !body.payload?.id)
      return Response.json({ received: true });
    const owner = wahaOwner(),
      eventId = 'waha-' + body.payload.id,
      existing = await db()
        .prepare('SELECT status FROM events WHERE owner=? AND id=?')
        .bind(owner, eventId)
        .first<{ status: string }>();
    if (!existing) {
      await db()
        .prepare(
          "INSERT INTO events(owner,id,lead_id,request,status,created) VALUES(?,?,0,?,'processing',?)",
        )
        .bind(owner, eventId, JSON.stringify({ source: 'waha' }), Date.now())
        .run();
      waitUntil(
        processMessage(owner, eventId, body.payload)
          .then(() =>
            db()
              .prepare(
                "UPDATE events SET status='done' WHERE owner=? AND id=? AND status='processing'",
              )
              .bind(owner, eventId)
              .run(),
          )
          .then(() => undefined),
      );
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error(
      'WAHA webhook rejected',
      error instanceof Error ? error.message : 'unknown',
    );
    return Response.json({ error: 'Webhook indisponível.' }, { status: 400 });
  }
}
