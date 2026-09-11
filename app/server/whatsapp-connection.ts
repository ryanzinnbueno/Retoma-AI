import {env} from 'cloudflare:workers';
import {AppError,db} from './store';

type Runtime={
 META_APP_ID?:string;META_APP_SECRET?:string;META_GRAPH_VERSION?:string;
 META_EMBEDDED_SIGNUP_CONFIG_ID?:string;RETOMA_CREDENTIALS_KEY?:string;
 WHATSAPP_ACCESS_TOKEN?:string;WHATSAPP_PHONE_NUMBER_ID?:string;WHATSAPP_WABA_ID?:string;
 WHATSAPP_WORKSPACE_OWNER?:string;
};
export type WhatsAppCredentials={owner:string;accessToken:string;phoneNumberId:string;wabaId:string;displayPhone?:string;businessName?:string};
const runtime=()=>env as unknown as Runtime;
const version=()=>runtime().META_GRAPH_VERSION?.trim()||'v25.0';
const bytes=(value:string)=>{const decoded=atob(value),result=new Uint8Array(decoded.length);for(let index=0;index<decoded.length;index++)result[index]=decoded.charCodeAt(index);return result};
const base64=(value:Uint8Array)=>{let text='';for(let i=0;i<value.length;i+=32768)text+=String.fromCharCode(...value.subarray(i,i+32768));return btoa(text)};
async function encryptionKey(){
 const encoded=runtime().RETOMA_CREDENTIALS_KEY?.trim();
 if(!encoded)throw new AppError(503,'A conexão automática ainda não foi liberada pela equipe Retoma.');
 let raw:Uint8Array<ArrayBuffer>;try{raw=bytes(encoded)}catch{throw new AppError(503,'A proteção das credenciais precisa ser configurada.');}
 if(raw.byteLength!==32)throw new AppError(503,'A proteção das credenciais precisa ser configurada.');
 return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function seal(value:string){const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(),new TextEncoder().encode(value));return `v1.${base64(iv)}.${base64(new Uint8Array(cipher))}`}
async function open(value:string){
 if(!value.startsWith('v1.'))return value;
 const [,iv,cipher]=value.split('.');
 try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv)},await encryptionKey(),bytes(cipher)))}catch{throw new AppError(503,'Não foi possível abrir a credencial do WhatsApp. Reconecte o número.');}
}
export function embeddedSignupPublicConfig(){
 const appId=runtime().META_APP_ID?.trim()||'',configId=runtime().META_EMBEDDED_SIGNUP_CONFIG_ID?.trim()||'';
 return {appId,configId,ready:Boolean(appId&&configId&&runtime().META_APP_SECRET?.trim()&&runtime().RETOMA_CREDENTIALS_KEY?.trim())};
}
export async function connectionForOwner(owner:string):Promise<WhatsAppCredentials|null>{
 const row=await db().prepare('SELECT owner,waba_id,phone_number_id,display_phone,business_name,access_token FROM whatsapp_connections WHERE owner=?').bind(owner).first<{owner:string;waba_id:string;phone_number_id:string;display_phone:string|null;business_name:string|null;access_token:string}>().catch(()=>null);
 if(row)return {owner:row.owner,wabaId:row.waba_id,phoneNumberId:row.phone_number_id,displayPhone:row.display_phone||undefined,businessName:row.business_name||undefined,accessToken:await open(row.access_token)};
 const r=runtime();if(owner===(r.WHATSAPP_WORKSPACE_OWNER?.trim()||'')&&r.WHATSAPP_ACCESS_TOKEN?.trim()&&r.WHATSAPP_PHONE_NUMBER_ID?.trim()&&r.WHATSAPP_WABA_ID?.trim())return {owner,accessToken:r.WHATSAPP_ACCESS_TOKEN.trim(),phoneNumberId:r.WHATSAPP_PHONE_NUMBER_ID.trim(),wabaId:r.WHATSAPP_WABA_ID.trim()};
 return null;
}
export async function connectionForNumber(phoneNumberId:string,wabaId:string):Promise<WhatsAppCredentials|null>{
 const row=await db().prepare('SELECT owner FROM whatsapp_connections WHERE phone_number_id=? AND waba_id=?').bind(phoneNumberId,wabaId).first<{owner:string}>().catch(()=>null);
 if(row)return connectionForOwner(row.owner);
 const r=runtime();if(phoneNumberId===r.WHATSAPP_PHONE_NUMBER_ID?.trim()&&wabaId===r.WHATSAPP_WABA_ID?.trim())return connectionForOwner(r.WHATSAPP_WORKSPACE_OWNER?.trim()||'');
 return null;
}
async function graph(path:string,accessToken:string,init?:RequestInit){
 const response=await fetch(`https://graph.facebook.com/${version()}/${path}`,{...init,headers:{Authorization:`Bearer ${accessToken}`,...init?.headers},signal:AbortSignal.timeout(15000)}),result:any=await response.json().catch(()=>({}));
 if(!response.ok)throw new AppError(502,result?.error?.error_user_msg||result?.error?.message||'A Meta recusou a configuração.');return result;
}
export async function finishEmbeddedSignup(owner:string,input:{code:string;wabaId:string;phoneNumberId:string}){
 const appId=runtime().META_APP_ID?.trim(),secret=runtime().META_APP_SECRET?.trim();
 if(!appId||!secret||!embeddedSignupPublicConfig().ready)throw new AppError(503,'A conexão automática ainda não foi liberada pela equipe Retoma.');
 if(!/^\d{5,30}$/.test(input.wabaId)||!/^\d{5,30}$/.test(input.phoneNumberId)||input.code.length<10)throw new AppError(400,'A Meta não devolveu todos os dados do número. Tente novamente.');
 const tokenUrl=new URL(`https://graph.facebook.com/${version()}/oauth/access_token`);tokenUrl.searchParams.set('client_id',appId);tokenUrl.searchParams.set('client_secret',secret);tokenUrl.searchParams.set('code',input.code);
 const tokenResponse=await fetch(tokenUrl,{signal:AbortSignal.timeout(15000)}),tokenResult:any=await tokenResponse.json().catch(()=>({}));
 if(!tokenResponse.ok||!tokenResult.access_token)throw new AppError(502,tokenResult?.error?.message||'Não foi possível concluir a autorização com a Meta.');
 const accessToken=String(tokenResult.access_token),phones=await graph(`${encodeURIComponent(input.wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name`,accessToken);
 const phone=(Array.isArray(phones.data)?phones.data:[]).find((item:any)=>String(item.id)===input.phoneNumberId);
 if(!phone)throw new AppError(403,'O número escolhido não pertence à conta autorizada.');
 await graph(`${encodeURIComponent(input.wabaId)}/subscribed_apps`,accessToken,{method:'POST'});
 const now=Date.now(),encrypted=await seal(accessToken);
 await db().prepare(`INSERT INTO whatsapp_connections(owner,waba_id,phone_number_id,display_phone,business_name,access_token,created,updated) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET waba_id=excluded.waba_id,phone_number_id=excluded.phone_number_id,display_phone=excluded.display_phone,business_name=excluded.business_name,access_token=excluded.access_token,updated=excluded.updated`).bind(owner,input.wabaId,input.phoneNumberId,String(phone.display_phone_number||''),String(phone.verified_name||''),encrypted,now,now).run();
 return {connected:true,displayPhone:String(phone.display_phone_number||''),businessName:String(phone.verified_name||'')};
}
