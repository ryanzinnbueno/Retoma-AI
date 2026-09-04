export async function askAI(leadId:number,question:string,messageId:string,mode:'reply'|'followup'='reply',retry=false){
 const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leadId,question,messageId,mode,retry}),signal:AbortSignal.timeout(45000)});
 const data:any=await response.json();if(!response.ok)throw new Error(data.error||'Falha ao consultar a IA.');return data;
}
