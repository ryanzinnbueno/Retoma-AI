import { env, waitUntil } from 'cloudflare:workers';
import { business } from '../../../business-model';
import { conversationalMessages, recordInterests } from '../../../conversation-tools';
import { terminal, type Lead, type Message } from '../../../recovery-model';
import { validateDecision } from '../../../server/decisions';
import { generate, mandatory, type Decision, type MediaInput } from '../../../server/gemini';
import { AppError, commit, db, load } from '../../../server/store';
import {connectionForNumber,connectionForOwner,type WhatsAppCredentials} from '../../../server/whatsapp-connection';

type MetaMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: { id?: string; caption?: string; mime_type?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  audio?: { id?: string; mime_type?: string };
};
type QueuedMessage = { message: MetaMessage; contactName: string; phoneNumberId: string; wabaId: string };
type Settings = Record<
  | 'WHATSAPP_VERIFY_TOKEN'
  | 'WHATSAPP_ACCESS_TOKEN'
  | 'WHATSAPP_PHONE_NUMBER_ID'
  | 'WHATSAPP_WABA_ID'
  | 'WHATSAPP_WORKSPACE_OWNER'
  | 'META_APP_SECRET'
  | 'META_GRAPH_VERSION',
  string | undefined
>;

const settings = () => env as unknown as Settings;
const noStore = { 'Cache-Control': 'no-store' };
function required(name: keyof Settings) {
  const value = settings()[name]?.trim();
  if (!value) throw new AppError(503, `Configuração ausente: ${name}`);
  return value;
}
function bytesFromHex(value: string) {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return new Uint8Array(value.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)));
}
async function validSignature(raw: ArrayBuffer, header: string | null) {
  const signature = header?.match(/^sha256=([a-f0-9]{64})$/i)?.[1];
  const bytes = signature ? bytesFromHex(signature) : null;
  if (!bytes) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(required('META_APP_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify('HMAC', key, bytes, raw);
}
function inboundText(message: MetaMessage) {
  const text =
    message.text?.body || message.button?.text ||
    message.interactive?.button_reply?.title || message.interactive?.list_reply?.title ||
    message.image?.caption || message.video?.caption || message.document?.caption;
  if (text?.trim()) return text.trim().slice(0, 6000);
  if (message.type === 'audio') return '[Cliente enviou um áudio para análise.]';
  if (message.type === 'image') return '[Cliente enviou uma imagem sem legenda para análise.]';
  if (message.type === 'document') return `[Cliente enviou um documento${message.document?.filename ? `: ${message.document.filename}` : ''}.]`.slice(0, 6000);
  return `[Cliente enviou uma mensagem do tipo ${message.type || 'não identificado'}.]`;
}
function encodeBase64(buffer:ArrayBuffer){
  const bytes=new Uint8Array(buffer);let binary='';
  for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
  return btoa(binary);
}
async function downloadMedia(message:MetaMessage,connection:WhatsAppCredentials):Promise<MediaInput|null>{
  const type=message.type==='image'?'image':message.type==='audio'?'audio':null;
  if(!type)return null;
  const media=type==='image'?message.image:message.audio,id=media?.id?.trim();
  if(!id)return null;
  const version=settings().META_GRAPH_VERSION?.trim()||'v25.0',token=connection.accessToken,phone=connection.phoneNumberId;
  const metadataResponse=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(id)}?phone_number_id=${encodeURIComponent(phone)}`,{
    headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000),
  });
  if(!metadataResponse.ok){await metadataResponse.body?.cancel();throw new AppError(502,`Não foi possível localizar a mídia no WhatsApp (${metadataResponse.status}).`);}
  const metadata:any=await metadataResponse.json(),url=String(metadata.url||'');
  const mimeType=String(metadata.mime_type||media?.mime_type||'').split(';')[0].trim().toLowerCase();
  const allowed=type==='image'?['image/jpeg','image/png']:['audio/aac','audio/mp4','audio/mpeg','audio/amr','audio/ogg'];
  const limit=type==='image'?5_000_000:12_000_000;
  if(!url.startsWith('https://')||!allowed.includes(mimeType)||Number(metadata.file_size||0)>limit)return null;
  const mediaResponse=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
  if(!mediaResponse.ok){await mediaResponse.body?.cancel();throw new AppError(502,`Não foi possível baixar a mídia do WhatsApp (${mediaResponse.status}).`);}
  const declared=Number(mediaResponse.headers.get('content-length')||0);
  if(declared>limit){await mediaResponse.body?.cancel();return null;}
  const buffer=await mediaResponse.arrayBuffer();if(buffer.byteLength>limit)return null;
  return {type,data:encodeBase64(buffer),mimeType};
}
function extract(payload: any): QueuedMessage[] {
  const result: QueuedMessage[] = [];
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return result;
  for (const entry of payload.entry) for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
    const value = change?.value;
    if (change?.field !== 'messages' || !Array.isArray(value?.messages)) continue;
    const names = new Map<string, string>((value.contacts || []).map((contact: any) => [String(contact?.wa_id || ''), String(contact?.profile?.name || '').trim()]));
    for (const message of value.messages as MetaMessage[]) if (message?.id && message?.from) result.push({
      message,
      contactName: names.get(message.from) || `Cliente ${message.from.slice(-4)}`,
      phoneNumberId: String(value?.metadata?.phone_number_id || ''),
      wabaId: String(entry?.id || ''),
    });
  }
  return result;
}
function newLead(id: number, item: QueuedMessage): Lead {
  return {
    id, externalId: `whatsapp:${item.message.from}`, name: item.contactName.slice(0, 200), company: '',
    service: 'Atendimento pelo WhatsApp', value: null, date: new Date().toISOString().slice(0, 10),
    status: 'Conversando', ai: true, consent: true, optOut: false, due: 'Em conversa', attempts: 0,
    reason: '', needsHuman: false, recoveryPaused: false,
    notes: 'Conversa iniciada pelo cliente no WhatsApp oficial.', messages: [],
    history: ['Atendimento iniciado pelo cliente na API oficial do WhatsApp.'], interests: [],
    events: [{ id: crypto.randomUUID(), at: new Date().toISOString(), status: 'Conversando', value: null, confirmed: false }],
  };
}
async function sendText(connection:WhatsAppCredentials,to: string, body: string) {
  const version = settings().META_GRAPH_VERSION?.trim() || 'v25.0';
  const response = await fetch(`https://graph.facebook.com/${version}/${connection.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) { await response.body?.cancel(); throw new AppError(502, `WhatsApp recusou o envio (${response.status}).`); }
  await response.body?.cancel();
}
async function showTyping(connection:WhatsAppCredentials,messageId: string) {
  const version = settings().META_GRAPH_VERSION?.trim() || 'v25.0';
  const response = await fetch(`https://graph.facebook.com/${version}/${connection.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId, typing_indicator: { type: 'text' } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) console.warn('WhatsApp typing indicator rejected', response.status);
  await response.body?.cancel();
}
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function setDelivery(owner: string, leadId: number, messageId: string, delivery: Message['delivery']) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const snapshot = await load(owner), lead = snapshot.data.leads.find((candidate) => candidate.id === leadId);
    const message = lead?.messages.find((candidate) => candidate.id === messageId);
    if (!lead || !message) return;
    message.delivery = delivery;
    try { await commit(owner, snapshot.revision, snapshot.data); return; }
    catch (error) { if (!(error instanceof AppError) || error.status !== 409 || attempt === 1) throw error; }
  }
}
async function processQueued(owner: string, eventId: string) {
  const claimed = await db().prepare("UPDATE events SET status='processing',created=? WHERE owner=? AND id=? AND status='queued'").bind(Date.now(), owner, eventId).run();
  if (!claimed.meta.changes) return;
  try {
    const event = await db().prepare('SELECT request FROM events WHERE owner=? AND id=?').bind(owner, eventId).first<{ request: string }>();
    if (!event) return;
    const connection=await connectionForOwner(owner);if(!connection)throw new AppError(503,'Conexão do WhatsApp não encontrada.');
    const item = JSON.parse(event.request) as QueuedMessage, incoming = inboundText(item.message);
    let snapshot = await load(owner), lead = snapshot.data.leads.find((candidate) => candidate.externalId === `whatsapp:${item.message.from}`);
    if (!lead) {
      if (snapshot.data.leads.length >= 100) throw new AppError(409, 'Limite de acompanhamentos atingido.');
      lead = newLead(Math.max(0, ...snapshot.data.leads.map((candidate) => candidate.id)) + 1, item);
      snapshot.data.leads.push(lead);
    }
    if (lead.messages.some((message) => message.id === eventId)) {
      await db().prepare("UPDATE events SET status='done',lead_id=? WHERE owner=? AND id=?").bind(lead.id, owner, eventId).run(); return;
    }
    const at = item.message.timestamp ? new Date(Number(item.message.timestamp) * 1000).toISOString() : new Date().toISOString();
    lead = { ...lead, name: item.contactName.slice(0, 200), status: 'Conversando', due: lead.ai ? 'Aguardando resposta da IA' : 'Ação do vendedor',
      messages: [...lead.messages, { id: eventId, role: 'cliente', text: incoming, createdAt: at, delivery: 'received' }],
      interests: recordInterests(lead, snapshot.data.config, incoming, eventId, at) };
    snapshot.data.leads = snapshot.data.leads.map((candidate) => candidate.id === lead!.id ? lead! : candidate);
    snapshot = await commit(owner, snapshot.revision, snapshot.data);
    await db().prepare('UPDATE events SET lead_id=? WHERE owner=? AND id=?').bind(lead.id, owner, eventId).run();
    if (!lead.ai || lead.optOut || terminal(lead) || business(snapshot.data.config).paused) {
      await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({ action: 'manual' }), owner, eventId).run(); return;
    }
    await showTyping(connection,eventId).catch((error) => console.warn('WhatsApp typing indicator failed', error instanceof Error ? error.message : 'unknown'));
    const media=await downloadMedia(item.message,connection);
    const mediaOnly = incoming.startsWith('[Cliente enviou')&&!media;
    const forced: Decision | null = mediaOnly ? {
      text: 'Recebi seu arquivo. O vendedor foi avisado para analisar esse conteúdo. Enquanto isso, você pode me explicar por texto qual é a sua dúvida.',
      action: 'handoff', reason: 'Conteúdo precisa de análise do vendedor.', summary: incoming,
      references: ['central:unsupported-media-v1'], provider: 'Regra obrigatória',
    } : mandatory(incoming);
    if (forced) await delay(650);
    const decision = forced || validateDecision(snapshot.data.config, lead, incoming, await generate(snapshot.data.config, lead, incoming, 'reply',media||undefined));
    const latest = await load(owner), current = latest.data.leads.find((candidate) => candidate.id === lead!.id);
    if (!current || !current.ai || current.optOut || terminal(current) || business(latest.data.config).paused) {
      await db().prepare("UPDATE events SET status='cancelled',result=? WHERE owner=? AND id=?").bind(JSON.stringify({ reason: 'Atendimento assumido.' }), owner, eventId).run(); return;
    }
    const stop = decision.action === 'stop', needsHuman = !stop && (current.needsHuman || decision.action === 'handoff'), replyId = `${eventId}-reply`;
    const next: Lead = { ...current, status: stop ? 'Encerrado' : 'Conversando', ai: !stop, optOut: stop, needsHuman,
      recoveryPaused: stop || needsHuman, reason: current.needsHuman ? current.reason : needsHuman ? decision.reason : '',
      aiSummary: needsHuman ? `${decision.summary}\nPendência para o vendedor: ${current.needsHuman ? current.reason : decision.reason}`.slice(0, 4000) : decision.summary,
      due: stop ? 'Não contatar' : needsHuman ? 'Ação do vendedor · IA disponível' : 'Enviando resposta',
      messages: [...current.messages, { id: replyId, role: 'ia', text: decision.text, createdAt: new Date().toISOString(), provider: decision.provider, delivery: 'pending', action: decision.action, references: decision.references }],
      history: [...current.history, stop ? 'Recusa registrada pelo WhatsApp oficial.' : needsHuman ? 'Vendedor alertado; a IA segue disponível até ele assumir.' : 'Resposta preparada para envio pelo WhatsApp oficial.'] };
    latest.data.leads = latest.data.leads.map((candidate) => candidate.id === next.id ? next : candidate);
    await commit(owner, latest.revision, latest.data);
    try {
      const parts = conversationalMessages(decision.text);
      for (let index = 0; index < parts.length; index++) {
        if (index > 0) {
          await showTyping(connection,eventId).catch(() => {});
          await delay(Math.min(1600, 650 + parts[index].length * 7));
        }
        await sendText(connection,item.message.from, parts[index]);
      }
      await setDelivery(owner, next.id, replyId, 'sent');
      await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({ action: decision.action }), owner, eventId).run();
    } catch (error) { await setDelivery(owner, next.id, replyId, 'failed').catch(() => {}); throw error; }
  } catch (error) {
    console.error('WhatsApp processing failed', error instanceof Error ? error.message : 'unknown');
    await db().prepare("UPDATE events SET status='failed',result=? WHERE owner=? AND id=?").bind(JSON.stringify({ error: error instanceof AppError ? error.message : 'Falha interna.' }), owner, eventId).run().catch(() => {});
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url), challenge = url.searchParams.get('hub.challenge');
  if (url.searchParams.get('hub.mode') !== 'subscribe' || url.searchParams.get('hub.verify_token') !== required('WHATSAPP_VERIFY_TOKEN') || !challenge)
    return new Response('Verificação recusada.', { status: 403, headers: noStore });
  return new Response(challenge, { status: 200, headers: { ...noStore, 'Content-Type': 'text/plain; charset=utf-8' } });
}
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') || '0') > 1_000_000) return new Response('Carga muito grande.', { status: 413 });
    const raw = await request.arrayBuffer();
    if (raw.byteLength > 1_000_000) return new Response('Carga muito grande.', { status: 413 });
    if (!(await validSignature(raw, request.headers.get('x-hub-signature-256')))) return new Response('Assinatura inválida.', { status: 401, headers: noStore });
    const queued: {owner:string;id:string}[] = [];
    for (const item of extract(JSON.parse(new TextDecoder().decode(raw)))) {
      const connection=await connectionForNumber(item.phoneNumberId,item.wabaId);if(!connection)continue;const owner=connection.owner;
      const existing = await db().prepare('SELECT status FROM events WHERE owner=? AND id=?').bind(owner, item.message.id).first<{ status: string }>();
      if (!existing) {
        await db().prepare("INSERT INTO events(owner,id,lead_id,request,status,created) VALUES(?,?,0,?,'queued',?)").bind(owner, item.message.id, JSON.stringify(item), Date.now()).run(); queued.push({owner,id:item.message.id});
      } else if (existing.status === 'failed') {
        const retried = await db().prepare("UPDATE events SET status='queued',created=? WHERE owner=? AND id=? AND status='failed'").bind(Date.now(), owner, item.message.id).run();
        if (retried.meta.changes) queued.push({owner,id:item.message.id});
      }
    }
    if (queued.length) waitUntil(Promise.all(queued.map((item) => processQueued(item.owner,item.id))).then(() => undefined));
    return Response.json({ received: true }, { status: 200, headers: noStore });
  } catch (error) {
    console.error('WhatsApp webhook rejected', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'Webhook indisponível.' }, { status: error instanceof AppError ? error.status : 400, headers: noStore });
  }
}
