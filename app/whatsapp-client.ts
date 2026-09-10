export async function sendWhatsAppMessage(
  leadId: number,
  text: string,
  direct: boolean,
) {
  const response = await fetch(
      direct ? '/api/whatsapp/send' : '/api/extension/outbound',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, text }),
        signal: AbortSignal.timeout(20000),
      },
    ),
    data = (await response.json()) as {
      error?: string;
      sent?: boolean;
      queued?: boolean;
      messageId?: string;
    };
  if (!response.ok)
    throw new Error(
      data.error || 'Não foi possível enviar a mensagem pelo WhatsApp.',
    );
  return data;
}
