import {AppError,commit,failure,identity,json,load,origin,readBody} from '../../../server/store';
import {conversationalMessages} from '../../../conversation-tools';
import {terminal,type Lead,type PendingExtensionReply} from '../../../recovery-model';

export async function POST(req:Request){
 try{
  origin(req);const owner=identity(req),body=await readBody(req);
  if(!Number.isInteger(body.leadId)||body.leadId<1)throw new AppError(400,'Conversa inválida.');
  if(typeof body.text!=='string'||!body.text.trim())throw new AppError(400,'Escreva uma mensagem.');
  const text=body.text.trim();if(text.length>4000)throw new AppError(400,'A mensagem deve ter no máximo 4.000 caracteres.');
  const snapshot=await load(owner),lead=snapshot.data.leads.find(item=>item.id===body.leadId);
  if(!lead)throw new AppError(404,'Conversa não encontrada.');
  if(!lead.externalId?.startsWith('whatsapp-web:'))throw new AppError(409,'Esta conversa não está vinculada à extensão.');
  if(lead.ai)throw new AppError(409,'Assuma a conversa antes de responder como vendedor.');
  if(lead.optOut||terminal(lead))throw new AppError(409,'Esta conversa está encerrada e não pode receber mensagens.');
  if(lead.pendingExtensionReply)throw new AppError(409,'Já existe uma mensagem aguardando o WhatsApp Web.');
  const at=new Date().toISOString(),requestMessageId='site-'+crypto.randomUUID();
  const pending:PendingExtensionReply={requestMessageId,text,parts:conversationalMessages(text),summary:lead.aiSummary||'',needsHuman:false,reason:'',stop:false,createdAt:at,sender:'vendedor'};
  const next:Lead={...lead,status:'Conversando',needsHuman:false,reason:'',due:'Aguardando envio pelo WhatsApp Web',pendingExtensionReply:pending,messages:[...lead.messages,{id:requestMessageId,role:'vendedor',text,createdAt:at,delivery:'pending'}],history:[...lead.history,'Mensagem do vendedor criada no Retoma e aguardando o WhatsApp Web.']};
  snapshot.data.leads=snapshot.data.leads.map(item=>item.id===next.id?next:item);
  await commit(owner,snapshot.revision,snapshot.data);
  return json({queued:true,messageId:requestMessageId});
 }catch(e){return failure(e)}
}
