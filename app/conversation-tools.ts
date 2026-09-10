import type {Lead} from './recovery-model';
import type {Config} from './recovery-model';
import {allCatalogue} from './business-model';
import {normalize} from './recovery-model';

export function shortMessages(text:string){
 const sentences=text.trim().split(/\n+|(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9])/u).filter(Boolean);
 const chunks:string[]=[];
 for(const sentence of sentences){
  if(sentence.length<=260){if(chunks.length&&chunks[chunks.length-1].length+sentence.length+1<=260)chunks[chunks.length-1]+=' '+sentence;else chunks.push(sentence);}
  else for(const word of sentence.split(/\s+/)){if(chunks.length&&chunks[chunks.length-1].length+word.length+1<=260)chunks[chunks.length-1]+=' '+word;else chunks.push(word);}
 }
 return chunks;
}
export function conversationalMessages(text:string){
 const trimmed=text.trim();if(!trimmed)return [];
 const paragraphs=trimmed.split(/\n{2,}/).map(part=>part.trim()).filter(Boolean);
 let parts=paragraphs.length>1?paragraphs.flatMap(shortMessages):shortMessages(trimmed);
 if(parts.length===1){
  const sentences=trimmed.split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9])/u).map(part=>part.trim()).filter(Boolean);
  if(sentences.length>1)parts=sentences.flatMap(shortMessages);
 }
 if(parts.length<=4)return parts;
 return [...parts.slice(0,3),parts.slice(3).join(' ')];
}
export function recordInterests(lead:Lead,config:Config,question:string,messageId:string,at:string):Lead['interests']{
 if(!lead.consent||lead.optOut)return lead.interests||[];
 const q=normalize(question);
 const matches=allCatalogue(config).filter(([,name])=>name.split(/\s+/).some(w=>w.length>3&&q.includes(normalize(w))));
 const records=[...(lead.interests||[])];
 for(const [id] of matches.slice(0,4)){if(!records.some(r=>r.productId===id&&r.messageId===messageId))records.push({productId:id,evidence:question.slice(0,500),messageId,at,kind:'mention'});}
 return records.slice(-60);
}
export function localDate(iso:string,zone:string){const date=new Date(iso);if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function periodRange(kind:string,zone:string,now=new Date()){
 const today=localDate(now.toISOString(),zone),[y,m,d]=today.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));
 if(kind==='week')date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 if(kind==='month')date.setUTCDate(1);
 return {from:date.toISOString().slice(0,10),to:today};
}
export function periodResults(leads:Lead[],from:string,to:string,zone:string){
 const within=(at?:string)=>!!at&&localDate(at,zone)>=from&&localDate(at,zone)<=to;
 const messages=leads.flatMap(l=>l.messages).filter(m=>within(m.createdAt));
 const sales=leads.filter(l=>l.status==='Vendido').map(l=>({lead:l,event:[...(l.events||[])].reverse().find(e=>e.status==='Vendido')})).filter(x=>x.event&&within(x.event.at));
 return {messages,sales,closed:leads.filter(l=>l.status==='Encerrado'&&within([...(l.events||[])].reverse().find(e=>e.status==='Encerrado')?.at)),undated:leads.filter(l=>l.status==='Vendido'&&!l.events?.some(e=>e.status==='Vendido')).length};
}
