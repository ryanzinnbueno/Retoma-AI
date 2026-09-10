import {env} from 'cloudflare:workers';
import {AppError,commit,failure,identity,load,origin,readBody,json} from '../../../server/store';
import {terminal,type Lead} from '../../../recovery-model';

async function send(to:string,text:string){
 const settings=env as unknown as Record<string,string|undefined>,token=settings.WHATSAPP_ACCESS_TOKEN?.trim(),phone=settings.WHATSAPP_PHONE_NUMBER_ID?.trim(),version=settings.META_GRAPH_VERSION?.trim()||'v25.0';
 if(!token||!phone)throw new AppError(503,'Conexão oficial do WhatsApp incompleta.');
 const response=await fetch(`https://graph.facebook.com/${version}/${phone}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:text}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){const details=await response.text();console.error('Official WhatsApp outbound rejected',response.status,details.slice(0,500));throw new AppError(502,`WhatsApp recusou o envio (${response.status}).`)}
 const data=await response.json() as {messages?:{id?:string}[]};return data.messages?.[0]?.id||crypto.randomUUID();
}

export async function POST(req:Request){
 try{
  origin(req);const owner=await identity(req),body=await readBody(req),text=typeof body.text==='string'?body.text.trim():'';
  if(!Number.isInteger(body.leadId)||!text||text.length>4000)throw new AppError(400,'Revise a conversa e a mensagem.');
  let snapshot=await load(owner),lead=snapshot.data.leads.find(item=>item.id===body.leadId);
  if(!lead?.externalId?.startsWith('whatsapp:'))throw new AppError(404,'Conversa oficial não encontrada.');
  if(lead.ai)throw new AppError(409,'Assuma a conversa antes de responder como vendedor.');
  if(lead.optOut||terminal(lead))throw new AppError(409,'Esta conversa está encerrada.');
  const to=lead.externalId.slice('whatsapp:'.length),messageId=await send(to,text),at=new Date().toISOString();
  const next:Lead={...lead,status:'Conversando',needsHuman:false,reason:'',due:'Aguardando cliente',messages:[...lead.messages,{id:messageId,role:'vendedor',text,createdAt:at,delivery:'sent'}],history:[...lead.history,'Vendedor respondeu pelo painel usando a API oficial.']};
  snapshot.data.leads=snapshot.data.leads.map(item=>item.id===next.id?next:item);await commit(owner,snapshot.revision,snapshot.data);return json({sent:true,messageId});
 }catch(error){return failure(error)}
}
