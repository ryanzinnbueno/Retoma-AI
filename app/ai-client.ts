import type { Config, Lead } from './recovery-model';
export type AIResult = { text:string; source:string; handoff?:string; stop?:boolean; summary?:string; provider:'Gemini'|'Regra de segurança' };
export async function askAI(config:Config,question:string,lead?:Lead,mode:'reply'|'followup'='reply'):Promise<AIResult>{
 const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config,question,lead,mode}),signal:AbortSignal.timeout(45000)});
 const data=await response.json() as AIResult & {error?:string};
 if(!response.ok)throw new Error(data.error||'Não foi possível consultar a IA.');
 return data;
}
