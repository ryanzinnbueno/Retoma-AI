import {env} from 'cloudflare:workers';
import {identity,json,failure} from '../../../server/store';

export async function GET(req:Request){
 try{
  await identity(req);
  const settings=env as unknown as Record<string,string|undefined>;
  return json({
   connected:!!(settings.WHATSAPP_ACCESS_TOKEN&&settings.WHATSAPP_PHONE_NUMBER_ID&&settings.WHATSAPP_WABA_ID),
   webhook:!!(settings.WHATSAPP_VERIFY_TOKEN&&settings.META_APP_SECRET),
   phoneNumberId:settings.WHATSAPP_PHONE_NUMBER_ID?.slice(-6)||'',
   wabaId:settings.WHATSAPP_WABA_ID?.slice(-6)||'',
  });
 }catch(error){return failure(error)}
}
