import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLeads,initialConfig,activate,changeStatus,followup,receiveMessage,replyTo,summarize} from '../app/recovery-model.ts';
import {cleanImportedMessages,lastImportedMessage,mergeImportedMessages} from '../app/extension-model.ts';
const lead=()=>structuredClone(initialLeads[0]);
const config=()=>structuredClone(initialConfig);
test('activation requires explicit conversation permission',()=>{
 assert.throws(()=>activate(lead(),false));
 const active=activate(lead(),true);assert.equal(active.ai,true);assert.equal(active.consent,true);
 assert.equal(initialLeads[0].ai,false);
});
test('sold and opted-out conversations cannot be activated',()=>{
 assert.throws(()=>activate(changeStatus(lead(),'Vendido'),true));
 assert.throws(()=>activate({...lead(),optOut:true},true));
});
test('unapproved conversation never follows up',()=>{
 const l=lead();assert.equal(followup(l,config()),l);
});
test('followups obey permission, state and maximum attempts',()=>{
 let l=activate(lead(),true);for(let i=0;i<3;i++)l=followup(l,config());
 assert.equal(l.attempts,3);assert.equal(l.due,'Limite atingido');assert.equal(followup(l,config()),l);
 const disabled=activate(lead(),true);assert.equal(followup(disabled,{...config(),followups:false}),disabled);
});
test('AI answers with approved knowledge and stops followup sequence',()=>{
 const l=receiveMessage(activate(lead(),true),'Vocês fazem instalação?',config());
 assert.equal(l.status,'Conversando');assert.equal(l.ai,true);assert.equal(l.messages.at(-1).role,'ia');
 assert.equal(l.messages.at(-1).text,config().knowledge[0].answer);
 assert.equal(followup(l,config()),l);
});
test('price objection alerts seller while AI stays available',()=>{
 const l=receiveMessage(activate(lead(),true),'Consegue um desconto de 10%?',config());
 assert.equal(l.ai,true);assert.equal(l.needsHuman,true);assert.match(summarize(l).reason,/negociação/);
});
test('seller request or unknown answer escalates with context',()=>{
 for(const text of ['Quero falar com um vendedor.','Qual a espessura exata do material?']){
  const l=receiveMessage(activate(lead(),true),text,config());
  assert.equal(l.ai,true);assert.equal(l.needsHuman,true);assert.equal(summarize(l).last,text);
 }
});
test('opt-out cancels all future automation even if manually reopened',()=>{
 const l=receiveMessage(activate(lead(),true),'Não quero receber mais mensagens.',config());
 assert.equal(l.optOut,true);assert.equal(l.status,'Encerrado');assert.equal(l.ai,false);
 assert.equal(followup(l,config()),l);assert.equal(receiveMessage(l,'Oi',config()),l);
 assert.throws(()=>activate(changeStatus(l,'Parado'),true));
});
test('mark sold is a conversation status, not an automatic revenue attribution',()=>{
 const l=receiveMessage(activate(lead(),true),'Pode fechar, aceito a proposta.',config());
 assert.equal(l.status,'Conversando');assert.equal(l.needsHuman,true);
 const sold=changeStatus(l,'Vendido');assert.equal(sold.ai,false);assert.equal(sold.needsHuman,false);
 assert.throws(()=>changeStatus(l,'Inválido'));
});
test('AI does not answer when a seller controls the conversation',()=>{
 const l=lead();const next=receiveMessage(l,'Vocês fazem instalação?',config());
 assert.equal(next.messages.length,l.messages.length+1);assert.equal(next.messages.at(-1).role,'cliente');
});
test('saved business facts and approved corrections affect the simulator',()=>{
 const c=config();c.offer='Fachadas especiais';c.region='Salvador';
 assert.match(replyTo('Quais serviços vocês fazem?',c).text,/Fachadas especiais/);
 assert.match(replyTo('Qual região atende?',c).text,/Salvador/);
 c.knowledge[0].answer='Exemplo revisado e aprovado.';
 assert.equal(replyTo('Vocês fazem instalação?',c).text,'Exemplo revisado e aprovado.');
});
test('price handoff setting changes the consultative response without inventing discount',()=>{
 const r=replyTo('Tem desconto?',{...config(),priceHandoff:false});
 assert.equal(r.handoff,undefined);assert.match(r.text,/Não consigo alterar/);
});
test('retoma tone and next interval use saved configuration',()=>{
 const c={...config(),tone:'Direto e objetivo',days:[2,5,9]};
 const l=followup(activate(lead(),true),c);
 assert.equal(l.due,'Dia 5');assert.match(l.messages.at(-1).text,/^Carlos, conseguiu/);
});
test('extension accepts only bounded customer and seller text',()=>{
 const items=cleanImportedMessages([{role:'cliente',text:'  Olá   tudo bem? '},{role:'ia',text:'ignorar'},{role:'vendedor',text:'Sim'}]);
 assert.deepEqual(items,[{role:'cliente',text:'Olá tudo bem?'},{role:'vendedor',text:'Sim'}]);
 assert.deepEqual(cleanImportedMessages('not-an-array'),[]);
});
test('extension import is idempotent and preserves repeated real messages',()=>{
 const base={...lead(),messages:[]};const items=[{role:'cliente',text:'Oi'},{role:'cliente',text:'Oi'},{role:'vendedor',text:'Olá'}];
 const once=mergeImportedMessages(base,items,'2026-09-04T10:00:00Z');const twice=mergeImportedMessages(once,items,'2026-09-04T11:00:00Z');
 assert.equal(once.messages.length,3);assert.equal(twice.messages.length,3);assert.equal(new Set(once.messages.map(m=>m.id)).size,3);
 assert.equal(lastImportedMessage(items).id,once.messages.at(-1).id);
 assert.equal(once.messages[0].delivery,'received');assert.equal(once.messages.at(-1).delivery,'sent');
});
