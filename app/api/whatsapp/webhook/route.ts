import { env } from 'cloudflare:workers';

function webhookToken() {
  return (env as unknown as { WHATSAPP_VERIFY_TOKEN?: string }).WHATSAPP_VERIFY_TOKEN?.trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = webhookToken();

  if (!expected) {
    return new Response('Webhook ainda não configurado.', { status: 503 });
  }

  if (mode !== 'subscribe' || token !== expected || !challenge) {
    return new Response('Verificação recusada.', { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST() {
  // O recebimento será habilitado no próximo passo, junto com validação de
  // assinatura, persistência e idempotência. Retornar 503 evita confirmar
  // mensagens antes de elas poderem ser processadas com segurança.
  return Response.json(
    { error: 'Recebimento de mensagens ainda não habilitado.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
