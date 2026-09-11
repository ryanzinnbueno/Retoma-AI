import {env} from 'cloudflare:workers';
import {terminal,type Message} from '../../../recovery-model';
import {AppError,commit,db,failure,identity,json,load,origin,readBody} from '../../../server/store';

type Runtime={WHATSAPP_ACCESS_TOKEN?:string;WHATSAPP_PHONE_NUMBER_ID?:string;META_GRAPH_VERSION?:string};
const runtime=()=>env as unknown as Runtime;
function required(name:keyof Runtime){const value=runtime()[name]?.trim();if(!value)throw new AppError(503,`Configuração ausente: ${name}`);return value}

async function send(to:string,text:string){
 const version=runtime().META_GRAPH_VERSION?.trim()||'v25.0';
 const response=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(required('WHATSAPP_PHONE_NUMBER_ID'))}/messages`,{
  method:'POST',headers:{Authorization:`Bearer ${required('WHATSAPP_ACCESS_TOKEN')}`,'Content-Type':'application/json'},
  body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:text}}),
  signal:AbortSignal.timeout(15000),
 });
 const result:any=await response.json().catch(()=>({}));
 if(!response.ok)throw new AppError(502,result?.error?.error_data?.details||result?.error?.message||`WhatsApp recusou o envio (${response.status}).`);
 return String(result?.messages?.[0]?.id||`seller-${crypto.randomUUID()}`);
}

export async function POST(request:Request){
 let owner='',requestId='';
 try{
  origin(request);owner=await identity(request);const body=await readBody(request);
  const leadId=Number(body.leadId),text=typeof body.text==='string'?body.text.trim():'',candidate=typeof body.requestId==='string'?body.requestId.trim():'';
  if(!Number.isInteger(leadId)||leadId<1||!text||text.length>4096||!/^[a-zA-Z0-9-]{16,100}$/.test(candidate))throw new AppError(400,'Revise a mensagem antes de enviar.');
  requestId=`seller:${candidate}`;
  const snapshot=await load(owner),lead=snapshot.data.leads.find(item=>item.id===leadId);
  if(!lead)throw new AppError(404,'Conversa não encontrada.');
  if(!lead.externalId?.startsWith('whatsapp:'))throw new AppError(409,'Esta conversa não veio do WhatsApp oficial.');
  if(lead.ai)throw new AppError(409,'Assuma a conversa antes de responder.');
  if(lead.optOut||terminal(lead))throw new AppError(409,'Esta conversa não permite novos envios.');
  const existing=await db().prepare('SELECT status,result FROM events WHERE owner=? AND id=?').bind(owner,requestId).first<{status:string;result:string|null}>();
  if(existing?.status==='done')return json({sent:true,snapshot:await load(owner)});
  if(existing)throw new AppError(409,'Esta mensagem já está sendo processada. Atualize a conversa.');
  await db().prepare("INSERT INTO events(owner,id,lead_id,request,status,created) VALUES(?,?,?,?, 'processing',?)").bind(owner,requestId,leadId,JSON.stringify({text}),Date.now()).run();
  const providerId=await send(lead.externalId.slice('whatsapp:'.length),text);
  for(let attempt=0;attempt<3;attempt++){
   const current=await load(owner),target=current.data.leads.find(item=>item.id===leadId);
   if(!target)throw new AppError(404,'Conversa não encontrada após o envio.');
   if(!target.messages.some(message=>message.id===providerId)){
    const message:Message={id:providerId,role:'vendedor',text,createdAt:new Date().toISOString(),delivery:'sent'};
    target.messages.push(message);target.status='Conversando';target.needsHuman=false;target.reason='';target.due='Aguardando cliente';
    target.history.push('Vendedor respondeu pelo painel usando a API oficial do WhatsApp.');
   }
   try{const saved=await commit(owner,current.revision,current.data);await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({providerId}),owner,requestId).run();return json({sent:true,snapshot:saved});}
   catch(error){if(!(error instanceof AppError)||error.status!==409||attempt===2)throw error}
  }
  throw new AppError(409,'A conversa mudou durante o envio. Atualize a página.');
 }catch(error){
  if(owner&&requestId)await db().prepare("UPDATE events SET status='failed',result=? WHERE owner=? AND id=?").bind(JSON.stringify({error:error instanceof Error?error.message:'Falha no envio'}),owner,requestId).run().catch(()=>{});
  return failure(error);
 }
}
