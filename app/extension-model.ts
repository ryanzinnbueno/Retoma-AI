import type {Lead,Message} from './recovery-model';

export type ImportedMessage={role:'cliente'|'vendedor';text:string};

export function cleanImportedMessages(value:unknown):ImportedMessage[]{
 if(!Array.isArray(value))return [];
 return value.slice(-40).flatMap(item=>{
  const role=(item as ImportedMessage)?.role,text=(item as ImportedMessage)?.text;
  if(!['cliente','vendedor'].includes(role)||typeof text!=='string')return [];
  const cleaned=text.replace(/\s+/g,' ').trim();
  return cleaned&&cleaned.length<=2000?[{role,text:cleaned} as ImportedMessage]:[];
 });
}

export function importedMessageId(item:ImportedMessage,occurrence:number){
 const input=`${item.role}\0${item.text}\0${occurrence}`;let hash=2166136261;
 for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return `wa-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

export function mergeImportedMessages(lead:Lead,items:ImportedMessage[],at:string):Lead{
 const occurrences=new Map<string,number>(),existing=new Set(lead.messages.map(m=>m.id).filter(Boolean));
 const additions:Message[]=[];
 for(const item of items){const key=item.role+'\0'+item.text,count=(occurrences.get(key)||0)+1;occurrences.set(key,count);const id=importedMessageId(item,count);if(!existing.has(id)){existing.add(id);additions.push({...item,id,createdAt:at,delivery:'suggested'});}}
 return {...lead,messages:[...lead.messages,...additions]};
}
