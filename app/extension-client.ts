export async function queueExtensionMessage(leadId:number,text:string){
 const response=await fetch('/api/extension/outbound',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leadId,text}),signal:AbortSignal.timeout(15000)});
 const data=await response.json() as {error?:string;queued?:boolean;messageId?:string};
 if(!response.ok)throw new Error(data.error||'Não foi possível enviar a mensagem para a extensão.');
 return data;
}
