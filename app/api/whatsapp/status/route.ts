import {env} from 'cloudflare:workers';
import {failure,identity,json} from '../../../server/store';

type Runtime={
 WHATSAPP_ACCESS_TOKEN?:string;
 WHATSAPP_PHONE_NUMBER_ID?:string;
 WHATSAPP_WABA_ID?:string;
 WHATSAPP_VERIFY_TOKEN?:string;
 META_APP_SECRET?:string;
 WHATSAPP_WORKSPACE_OWNER?:string;
};

export async function GET(request:Request){
 try{
  await identity(request);
  const runtime=env as unknown as Runtime;
  const credentials=Boolean(runtime.WHATSAPP_ACCESS_TOKEN?.trim()&&runtime.WHATSAPP_PHONE_NUMBER_ID?.trim()&&runtime.WHATSAPP_WABA_ID?.trim());
  const webhook=Boolean(runtime.WHATSAPP_VERIFY_TOKEN?.trim()&&runtime.META_APP_SECRET?.trim()&&runtime.WHATSAPP_WORKSPACE_OWNER?.trim());
  return json({connected:credentials&&webhook,credentials,webhook,channel:'WhatsApp Cloud API'});
 }catch(error){return failure(error)}
}
