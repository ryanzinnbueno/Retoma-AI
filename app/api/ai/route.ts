import { identity,origin,load,commit,db,json,failure,readBody,AppError } from '../../server/store';
import { generate,mandatory } from '../../server/gemini';
import { validateDecision } from '../../server/decisions';
import { business } from '../../business-model';
import { recordInterests } from '../../conversation-tools';
import { terminal,type Lead } from '../../recovery-model';
export async function POST(req:Request){
 let owner='',eventId='',claimed=false;
 try{
  origin(req);owner=identity(req);const body=await readBody(req);
  const {leadId,question,mode='reply',messageId,retry=false}=body;
  if(!Number.isSafeInteger(leadId)||typeof question!=='string'||!question.trim()||question.length>2000||!['reply','followup'].includes(mode)||typeof messageId!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(messageId))throw new AppError(400,'Mensagem ou acompanhamento inválido.');
  eventId=messageId;
  const encoded=JSON.stringify({leadId,question,mode});
  const existing=await db().prepare('SELECT request,status,result FROM events WHERE owner=? AND id=?').bind(owner,eventId).first<{request:string;status:string;result:string|null}>();
  if(existing){
   if(existing.request!==encoded)throw new AppError(409,'Identificador já usado em outra mensagem.');
   if(existing.status==='done')return json({...await load(owner),duplicate:true});
   if(existing.status!=='failed'||!retry)throw new AppError(409,existing.status==='processing'?'Mensagem já está em processamento.':'Tentativa anterior concluída sem resposta. Use tentar novamente.');
   const r=await db().prepare("UPDATE events SET status='processing',created=? WHERE owner=? AND id=? AND status='failed'").bind(Date.now(),owner,eventId).run();if(!r.meta.changes)throw new AppError(409,'Já está em processamento.');
  }else{
   const recent=await db().prepare('SELECT COUNT(*) AS n FROM events WHERE owner=? AND created>?').bind(owner,Date.now()-60000).first<{n:number}>();if((recent?.n||0)>=6)throw new AppError(429,'Limite de testes atingido. Aguarde um minuto.');
   const r=await db().prepare("INSERT OR IGNORE INTO events(owner,id,lead_id,request,status,created) VALUES(?,?,?,?,'processing',?)").bind(owner,eventId,leadId,encoded,Date.now()).run();if(!r.meta.changes)throw new AppError(409,'Mensagem já está sendo processada.');
  }
  claimed=true;
  let snapshot=await load(owner);let lead=snapshot.data.leads.find(l=>l.id===leadId);if(!lead)throw new AppError(404,'Acompanhamento não encontrado.');
  if(lead.messages.some(m=>m.id===eventId+'-reply')){await db().prepare("UPDATE events SET status='done' WHERE owner=? AND id=?").bind(owner,eventId).run();return json({...snapshot,duplicate:true});}
  if(terminal(lead)||lead.optOut)throw new AppError(409,'Acompanhamento encerrado ou contato recusado.');
  const b=business(snapshot.data.config);
  if(mode==='followup'&&(!lead.ai||!lead.consent||lead.recoveryPaused||b.paused||lead.status!=='Parado'||!snapshot.data.config.followups||lead.attempts>=snapshot.data.config.days.length))throw new AppError(409,'Retomada não permitida neste estado.');
  if(mode==='reply'&&!lead.messages.some(m=>m.id===eventId)){
   const at=new Date().toISOString();
   lead={...lead,interests:recordInterests(lead,snapshot.data.config,question,eventId,at),status:'Conversando',due:lead.ai?'Aguardando resposta da IA':'Ação do vendedor',messages:[...lead.messages,{id:eventId,role:'cliente',text:question,createdAt:at,delivery:'demo'}]};
   snapshot.data.leads=snapshot.data.leads.map(l=>l.id===leadId?lead!:l);
   snapshot=await commit(owner,snapshot.revision,snapshot.data);
  }
  const forced=mode==='reply'?mandatory(question):null;
  if(forced?.action!=='stop'&&(!lead.ai||!lead.consent||b.paused)){
   await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({action:'manual'}),owner,eventId).run();return json(snapshot);
  }
  const repeatedHumanRequest=forced?.action==='handoff'&&lead.needsHuman&&lead.messages.some(m=>m.role==='cliente'&&m.id!==eventId&&m.text.trim().toLowerCase()===question.trim().toLowerCase());
  const result=forced||validateDecision(snapshot.data.config,lead,question,await generate(snapshot.data.config,lead,question,mode));
  if(forced?.action==='handoff')result.summary=`Assunto: ${lead.service}. Contexto: ${lead.notes||'Não informado'}. Conversa recente: ${lead.messages.slice(-6).map(m=>m.role+': '+m.text).join(' | ')}. Pendente: ${result.reason}`.slice(0,4000);
  const latest=await load(owner);const current=latest.data.leads.find(l=>l.id===leadId);
  if(latest.revision!==snapshot.revision||!current||current.optOut||terminal(current)||(forced?.action!=='stop'&&(!current.ai||!current.consent||business(latest.data.config).paused))){await db().prepare("UPDATE events SET status='cancelled',result=? WHERE owner=? AND id=?").bind(JSON.stringify({reason:'Estado alterado antes da conclusão.'}),owner,eventId).run();throw new AppError(409,'A resposta foi descartada porque a conversa ou configuração mudou.');}
  const pending=result.action!=='stop'&&(current.needsHuman||result.action==='handoff');
  const reason=result.action==='stop'?result.reason:current.needsHuman?(result.action==='handoff'&&!current.reason.includes(result.reason)?`${current.reason}\n${result.reason}`.slice(0,4000):current.reason):result.reason;
  const silent=repeatedHumanRequest||(result.action==='stop'&&(!current.ai||!current.consent||business(latest.data.config).paused));
  const next:Lead={...current,status:result.action==='stop'?'Encerrado':mode==='followup'?'Parado':'Conversando',
   ai:result.action==='stop'?false:current.ai,optOut:result.action==='stop',
   recoveryPaused:result.action==='stop'||pending?true:current.recoveryPaused,needsHuman:pending,
   reason,aiSummary:pending?`${result.summary}\nPendência para o vendedor: ${reason}`.slice(0,4000):result.summary,attempts:mode==='followup'?current.attempts+1:current.attempts,
   due:result.action==='stop'?'Não contatar':pending?'Ação do vendedor · IA disponível':mode==='followup'?'Aguardando cliente':'Em conversa',
   events:result.action==='stop'?[...(current.events||[]),{id:eventId,at:new Date().toISOString(),status:'Encerrado',value:current.value,confirmed:false}]:current.events,
   messages:silent?current.messages:[...current.messages,{id:eventId+'-reply',role:'ia',text:result.text,createdAt:new Date().toISOString(),provider:result.provider,delivery:'demo',action:result.action,references:result.references}],
   history:repeatedHumanRequest?current.history:[...current.history,result.action==='handoff'?(current.needsHuman?'Pendência do vendedor atualizada. IA continua disponível.':'Alerta interno ao vendedor registrado. IA continua disponível para outras dúvidas. Nenhuma notificação externa enviada.'):result.action==='stop'?'Recusa registrada. Novos contatos bloqueados.':mode==='followup'?'Retomada de teste gerada; não enviada ao WhatsApp.':'Resposta de teste gerada; não enviada ao WhatsApp.']};
  latest.data.leads=latest.data.leads.map(l=>l.id===leadId?next:l);
  // Atomic compare-and-swap: a seller taking over always invalidates this generated result.
  const saved=await commit(owner,latest.revision,latest.data);
  await db().prepare("UPDATE events SET status='done',result=? WHERE owner=? AND id=?").bind(JSON.stringify({action:result.action,reason:result.reason,references:result.references}),owner,eventId).run();
  return json(saved);
 }catch(e){
  if(claimed)await db().prepare("UPDATE events SET status='failed',result=? WHERE owner=? AND id=? AND status='processing'").bind(JSON.stringify({error:e instanceof AppError?e.status:500}),owner,eventId).run().catch(()=>{});
  return failure(e);
 }
}
