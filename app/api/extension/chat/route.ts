import {db,load,commit,readBody,AppError} from '../../../server/store';
import {generate,mandatory} from '../../../server/gemini';
import {validateDecision} from '../../../server/decisions';
import {business} from '../../../business-model';
import {cleanImportedMessages,lastImportedMessage,mergeImportedMessages} from '../../../extension-model';
import {recordInterests,shortMessages} from '../../../conversation-tools';
import {terminal,type Lead} from '../../../recovery-model';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:cors});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
async function authenticate(req:Request){const match=req.headers.get('authorization')?.match(/^Bearer (rtm_[a-f0-9]{64})$/);if(!match)throw new AppError(401,'Vincule a extensão ao Retoma.');const row=await db().prepare('SELECT owner FROM extension_links WHERE token_hash=? AND revoked=0').bind(await hash(match[1])).first<{owner:string}>();if(!row)throw new AppError(401,'Vínculo inválido ou revogado.');await db().prepare('UPDATE extension_links SET last_used=? WHERE owner=?').bind(Date.now(),row.owner).run();return row.owner;}
const state=(lead?:Lead)=>({tracked:!!lead,active:!!lead?.ai&&!lead?.optOut&&!terminal(lead),needsHuman:!!lead?.needsHuman,reason:lead?.reason||'',summary:lead?.aiSummary||'',status:lead?.status||'',service:lead?.service||'',pending:lead?.pendingExtensionReply||null});
function newLead(data:{id:number;externalId:string;name:string;subject:string}):Lead{return {id:data.id,externalId:data.externalId,name:data.name,company:'',service:data.subject||'Conversa do WhatsApp',value:null,date:new Date().toISOString().slice(0,10),status:'Conversando',ai:true,consent:true,optOut:false,due:'Em conversa',attempts:0,reason:'',needsHuman:false,notes:'Conversa acompanhada pela extensão Retoma no WhatsApp Web.',messages:[],history:['Acompanhamento automático criado pela extensão do Retoma.'],interests:[],events:[{id:crypto.randomUUID(),at:new Date().toISOString(),status:'Conversando',value:null,confirmed:false}]};}

export async function OPTIONS(){return new Response(null,{status:204,headers:cors})}
export async function POST(req:Request){let owner='',eventId='';try{
 owner=await authenticate(req);const body=await readBody(req);const mode=['status','activate','auto','sent','seller','pause','outbox'].includes(body.mode)?body.mode:'status';
 if(mode==='outbox'){
  const snapshot=await load(owner),items=snapshot.data.leads.filter(lead=>lead.externalId?.startsWith('whatsapp-web:')&&lead.pendingExtensionReply).slice(0,10).map(lead=>({contactKey:lead.externalId!.slice('whatsapp-web:'.length),contactName:lead.name,pending:lead.pendingExtensionReply}));
  return respond({items});
 }
 if(typeof body.contactKey!=='string'||!body.contactKey.trim()||body.contactKey.length>200)throw new AppError(400,'Abra uma conversa válida no WhatsApp Web.');
 const name=typeof body.contactName==='string'&&body.contactName.trim()?body.contactName.trim().slice(0,200):body.contactKey.trim().slice(0,200),externalId='whatsapp-web:'+body.contactKey.trim();
 let snapshot=await load(owner),lead=snapshot.data.leads.find(l=>l.externalId===externalId);
 if(mode==='status')return respond(state(lead));
 if(mode==='pause'||mode==='seller'){
  if(!lead)throw new AppError(404,'Esta conversa ainda não está sendo acompanhada.');
  const items=cleanImportedMessages(body.messages);if(items.length)lead=mergeImportedMessages(lead,items,new Date().toISOString());
  lead={...lead,ai:false,pendingExtensionReply:undefined,due:'Atendimento manual',history:[...lead.history,mode==='seller'?'Vendedor respondeu no WhatsApp Web. A IA foi pausada automaticamente.':'Vendedor pausou a IA pelo WhatsApp Web.']};
  snapshot.data.leads=snapshot.data.leads.map(l=>l.id===lead!.id?lead!:l);await commit(owner,snapshot.revision,snapshot.data);return respond({...state(lead),paused:true});
 }
 if(mode==='sent'){
  if(!lead)throw new AppError(404,'Esta conversa ainda não está sendo acompanhada.');const pending=lead.pendingExtensionReply;if(!pending||pending.requestMessageId!==body.requestMessageId)return respond({...state(lead),acknowledged:true});const at=new Date().toISOString();
  const seller=pending.sender==='vendedor';
  const messages=seller?lead.messages.map(message=>message.id===pending.requestMessageId?{...message,delivery:'sent' as const}:message):[...lead.messages,{id:'wa-ai-'+crypto.randomUUID(),role:'ia' as const,text:pending.text,provider:'Gemini',createdAt:at,delivery:'sent' as const}];
  const next:Lead={...lead,lastAutoReplyTo:seller?lead.lastAutoReplyTo:pending.requestMessageId,pendingExtensionReply:undefined,due:pending.stop?'Não contatar':lead.needsHuman?'Ação do vendedor · IA disponível':'Aguardando cliente',messages,history:[...lead.history,seller?'Mensagem do vendedor enviada pelo WhatsApp Web.':pending.stop?'Resposta final enviada e acompanhamento encerrado.':lead.needsHuman?'Resposta enviada; vendedor alertado e IA continua disponível.':'Resposta automática enviada pela extensão.']};snapshot.data.leads=snapshot.data.leads.map(l=>l.id===next.id?next:l);await commit(owner,snapshot.revision,snapshot.data);return respond({...state(next),acknowledged:true});
 }
 const cleaned=cleanImportedMessages(body.messages),items=lead?cleaned.filter(item=>!(item.role==='vendedor'&&lead!.messages.some(message=>message.role==='ia'&&message.delivery==='sent'&&message.text===item.text))):cleaned;if(!items.length)throw new AppError(400,'Nenhuma mensagem legível foi encontrada na conversa aberta.');
 if(!lead){if(body.consent!==true)throw new AppError(400,'Ative o acompanhamento antes de responder automaticamente.');if(snapshot.data.leads.length>=100)throw new AppError(409,'Limite de acompanhamentos atingido.');lead=newLead({id:Math.max(0,...snapshot.data.leads.map(l=>l.id))+1,externalId,name,subject:typeof body.subject==='string'?body.subject.trim().slice(0,160):''});snapshot.data.leads.push(lead);}
 if(lead.optOut||terminal(lead))throw new AppError(409,'Este acompanhamento está encerrado e não pode ser reativado pela extensão.');
 const at=new Date().toISOString(),before=lead.messages.length;lead=mergeImportedMessages(lead,items,at);lead={...lead,name,service:typeof body.subject==='string'&&body.subject.trim()?body.subject.trim().slice(0,160):lead.service,consent:true,status:'Conversando'};
 if(mode==='activate')lead={...lead,ai:true,needsHuman:false,reason:'',due:'Aguardando cliente',history:[...lead.history,'Acompanhamento automático ativado no WhatsApp Web.']};
 snapshot.data.leads=snapshot.data.leads.map(l=>l.id===lead!.id?lead!:l);snapshot=await commit(owner,snapshot.revision,snapshot.data);
 if(mode==='activate')return respond({...state(lead),activated:true,imported:lead.messages.length-before});
 if(!lead.ai)throw new AppError(409,'A IA está pausada nesta conversa.');if(business(snapshot.data.config).paused)throw new AppError(409,'A IA está em pausa geral no Retoma.');
 const last=lastImportedMessage(items);if(!last||last.item.role!=='cliente')return respond({...state(lead),noReply:true});
 if(lead.lastAutoReplyTo===last.id)return respond({...state(lead),noReply:true});
 if(lead.pendingExtensionReply?.requestMessageId===last.id)return respond({...state(lead),reply:lead.pendingExtensionReply});
 const recent=await db().prepare('SELECT COUNT(*) AS n FROM events WHERE owner=? AND created>?').bind(owner,Date.now()-60000).first<{n:number}>();if((recent?.n||0)>=12)throw new AppError(429,'Muitas mensagens em pouco tempo. Aguarde um minuto.');
 eventId=typeof body.requestId==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId)?body.requestId:crypto.randomUUID();
 const created=await db().prepare("INSERT OR IGNORE INTO events(owner,id,lead_id,request,status,created) VALUES(?,?,?,?,'processing',?)").bind(owner,eventId,lead.id,JSON.stringify({source:'extension-auto',externalId,messageId:last.id}),Date.now()).run();if(!created.meta.changes)throw new AppError(409,'Esta mensagem já está sendo processada.');
 const latestBefore=await load(owner),currentBefore=latestBefore.data.leads.find(l=>l.id===lead!.id);if(!currentBefore)throw new AppError(404,'Conversa não encontrada.');currentBefore.interests=recordInterests(currentBefore,latestBefore.data.config,last.item.text,last.id,at);latestBefore.data.leads=latestBefore.data.leads.map(l=>l.id===currentBefore.id?currentBefore:l);await commit(owner,latestBefore.revision,latestBefore.data);
 const forced=mandatory(last.item.text),decision=forced||validateDecision(snapshot.data.config,lead,last.item.text,await generate(snapshot.data.config,lead,last.item.text,'reply'));
 const latest=await load(owner),current=latest.data.leads.find(l=>l.id===lead!.id);if(!current||!current.ai||business(latest.data.config).paused)throw new AppError(409,'A IA foi pausada antes de concluir a resposta.');
 const stop=decision.action==='stop',needsHuman=!stop&&(current.needsHuman||decision.action==='handoff'),reason=current.needsHuman?current.reason:(needsHuman?decision.reason:'');
 const pending={requestMessageId:last.id,text:decision.text,parts:shortMessages(decision.text),summary:decision.summary,needsHuman,reason,stop,createdAt:at,sender:'ia' as const};
 const next:Lead={...current,ai:!stop,optOut:stop,recoveryPaused:stop||needsHuman,needsHuman,reason,status:stop?'Encerrado':'Conversando',due:stop?'Não contatar':needsHuman?'Ação do vendedor · IA disponível':'Enviando resposta',aiSummary:decision.summary,pendingExtensionReply:pending,history:[...current.history,stop?'Pedido de interrupção identificado pela extensão.':needsHuman?'Vendedor alertado; a IA segue disponível até ele assumir.':'Resposta automática preparada pela extensão.']};
 latest.data.leads=latest.data.leads.map(l=>l.id===next.id?next:l);await commit(owner,latest.revision,latest.data);await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({action:decision.action,messageId:last.id}),owner,eventId).run();return respond({...state(next),reply:pending,assistant:latest.data.config.assistant});
 }catch(e){if(owner&&eventId)await db().prepare("UPDATE events SET status='failed',result=? WHERE owner=? AND id=? AND status='processing'").bind(JSON.stringify({error:e instanceof AppError?e.status:500}),owner,eventId).run().catch(()=>{});return respond({error:e instanceof AppError?e.message:'Não foi possível preparar a resposta.'},e instanceof AppError?e.status:500)}}
