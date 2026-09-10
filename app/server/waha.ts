import { env } from 'cloudflare:workers';
import { AppError } from './store';

type WahaEnv = {
  WAHA_BASE_URL?: string;
  WAHA_API_KEY?: string;
  WAHA_SESSION?: string;
  WAHA_WEBHOOK_SECRET?: string;
  WHATSAPP_WORKSPACE_OWNER?: string;
};

function settings() {
  return env as unknown as WahaEnv;
}
export function wahaConfigured() {
  const value = settings();
  return (
    !!value.WAHA_BASE_URL?.trim() &&
    !!value.WAHA_API_KEY?.trim() &&
    !!value.WAHA_WEBHOOK_SECRET?.trim()
  );
}
export function wahaSession() {
  const value = settings().WAHA_SESSION?.trim() || 'retoma';
  return /^[a-zA-Z0-9_-]{1,60}$/.test(value) ? value : 'retoma';
}
export function wahaOwner() {
  return settings().WHATSAPP_WORKSPACE_OWNER?.trim() || 'retoma-principal';
}
export function wahaWebhookSecret() {
  const value = settings().WAHA_WEBHOOK_SECRET?.trim();
  if (!value)
    throw new AppError(503, 'Servidor do WhatsApp ainda não configurado.');
  return value;
}

export async function wahaRequest(path: string, init: RequestInit = {}) {
  const value = settings(),
    base = value.WAHA_BASE_URL?.trim(),
    key = value.WAHA_API_KEY?.trim();
  if (!base || !key)
    throw new AppError(503, 'Servidor do WhatsApp ainda não configurado.');
  let url: URL;
  try {
    url = new URL(path, new URL(base.endsWith('/') ? base : base + '/'));
  } catch {
    throw new AppError(503, 'Endereço do servidor do WhatsApp inválido.');
  }
  const headers = new Headers(init.headers);
  headers.set('X-Api-Key', key);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal || AbortSignal.timeout(20000),
    });
  } catch {
    throw new AppError(502, 'O servidor do WhatsApp não respondeu.');
  }
  return response;
}

export async function wahaJson(path: string, init: RequestInit = {}) {
  const response = await wahaRequest(path, init),
    text = await response.text(),
    data = text ? JSON.parse(text) : {};
  if (!response.ok)
    throw new AppError(
      response.status === 404 ? 404 : 502,
      typeof data?.message === 'string'
        ? data.message
        : 'O servidor do WhatsApp recusou a solicitação.',
    );
  return data;
}

export async function sendWahaText(chatId: string, text: string) {
  return wahaJson('/api/sendText', {
    method: 'POST',
    body: JSON.stringify({
      session: wahaSession(),
      chatId,
      text,
      linkPreview: false,
    }),
  });
}

export async function setWahaTyping(chatId: string, typing: boolean) {
  const endpoint = typing ? '/api/startTyping' : '/api/stopTyping';
  return wahaJson(endpoint, {
    method: 'POST',
    body: JSON.stringify({ session: wahaSession(), chatId }),
  });
}
