import {
  identity,
  origin,
  readBody,
  load,
  commit,
  json,
  failure,
  AppError,
} from '../../../server/store';
import { sendWahaText } from '../../../server/waha';
import { terminal, type Lead } from '../../../recovery-model';

export async function POST(req: Request) {
  try {
    origin(req);
    const owner = await identity(req),
      body = await readBody(req);
    if (
      !Number.isSafeInteger(body.leadId) ||
      typeof body.text !== 'string' ||
      !body.text.trim() ||
      body.text.length > 4000
    )
      throw new AppError(400, 'Revise a mensagem.');
    const snapshot = await load(owner),
      lead = snapshot.data.leads.find((item) => item.id === body.leadId) as
        | Lead
        | undefined;
    if (!lead) throw new AppError(404, 'Conversa não encontrada.');
    if (!lead.externalId?.startsWith('whatsapp-direct:'))
      throw new AppError(
        409,
        'Esta conversa não está conectada diretamente ao WhatsApp.',
      );
    if (lead.ai)
      throw new AppError(
        409,
        'Assuma a conversa antes de responder como vendedor.',
      );
    if (lead.optOut || terminal(lead))
      throw new AppError(409, 'Esta conversa está encerrada.');
    const text = body.text.trim(),
      chatId = lead.externalId.slice('whatsapp-direct:'.length),
      messageId = 'seller-' + crypto.randomUUID();
    await sendWahaText(chatId, text);
    const latest = await load(owner),
      current = latest.data.leads.find((item) => item.id === lead.id);
    if (!current) throw new AppError(404, 'Conversa não encontrada.');
    const next = {
      ...current,
      status: 'Conversando' as const,
      needsHuman: false,
      due: 'Atendimento manual',
      messages: [
        ...current.messages,
        {
          id: messageId,
          role: 'vendedor' as const,
          text,
          createdAt: new Date().toISOString(),
          delivery: 'sent' as const,
        },
      ],
      history: [...current.history, 'Vendedor respondeu pelo Retoma.'],
    };
    latest.data.leads = latest.data.leads.map((item) =>
      item.id === next.id ? next : item,
    );
    await commit(owner, latest.revision, latest.data);
    return json({ sent: true, messageId });
  } catch (error) {
    return failure(error);
  }
}
