import {
  identity,
  origin,
  json,
  failure,
  AppError,
} from '../../../server/store';
import {
  wahaConfigured,
  wahaJson,
  wahaRequest,
  wahaSession,
  wahaWebhookSecret,
} from '../../../server/waha';

type SessionInfo = {
  name?: string;
  status?: string;
  me?: { id?: string; pushName?: string } | null;
};

async function readSession() {
  if (!wahaConfigured()) return null;
  const response = await wahaRequest(
    `/api/sessions/${encodeURIComponent(wahaSession())}`,
  );
  if (response.status === 404) {
    await response.body?.cancel();
    return null;
  }
  const data = (await response.json()) as SessionInfo;
  if (!response.ok)
    throw new AppError(502, 'Não foi possível consultar o WhatsApp.');
  return data;
}
async function state() {
  const session = await readSession();
  if (!session)
    return {
      configured: wahaConfigured(),
      status: 'DISCONNECTED',
      connected: false,
      phone: null,
      name: null,
      qr: null,
    };
  let qr: null | string = null;
  if (session.status === 'SCAN_QR_CODE')
    try {
      const data = await wahaJson(
        `/api/${encodeURIComponent(wahaSession())}/auth/qr?format=image`,
        { headers: { Accept: 'application/json' } },
      );
      if (data?.data)
        qr = `data:${data.mimetype || 'image/png'};base64,${data.data}`;
    } catch {}
  return {
    configured: true,
    status: session.status || 'STARTING',
    connected: session.status === 'WORKING',
    phone: session.me?.id?.replace(/@.*/, '') || null,
    name: session.me?.pushName || null,
    qr,
  };
}
export async function GET(req: Request) {
  try {
    await identity(req);
    return json(await state());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    await identity(req);
    if (!wahaConfigured())
      throw new AppError(
        503,
        'Configure o servidor do WhatsApp antes de gerar o QR Code.',
      );
    const name = wahaSession(),
      webhook = new URL('/api/whatsapp/waha-webhook', req.url).toString(),
      config = {
        webhooks: [
          {
            url: webhook,
            events: ['message.any', 'session.status'],
            customHeaders: [
              { name: 'X-Retoma-Webhook-Secret', value: wahaWebhookSecret() },
            ],
            retries: { policy: 'constant', delaySeconds: 2, attempts: 8 },
          },
        ],
        ignore: { status: true, groups: true, channels: true },
        client: { deviceName: 'Retoma', browserName: 'Chrome' },
      };
    const current = await readSession();
    if (!current)
      await wahaJson('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ name, start: true, config }),
      });
    else {
      await wahaJson(`/api/sessions/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify({ name, config }),
      });
      await wahaJson(`/api/sessions/${encodeURIComponent(name)}/start`, {
        method: 'POST',
      });
    }
    return json(await state());
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(req: Request) {
  try {
    origin(req);
    await identity(req);
    if (!wahaConfigured())
      throw new AppError(503, 'Servidor do WhatsApp ainda não configurado.');
    await wahaJson(
      `/api/sessions/${encodeURIComponent(wahaSession())}/logout`,
      { method: 'POST' },
    );
    return json({ connected: false, status: 'DISCONNECTED' });
  } catch (error) {
    return failure(error);
  }
}
