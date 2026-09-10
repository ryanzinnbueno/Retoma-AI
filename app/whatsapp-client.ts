export async function sendOfficialMessage(leadId:number,text:string){
 const response=await fetch('/api/whatsapp/outbound',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leadId,text}),signal:AbortSignal.timeout(20000)});
 const data:any=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível enviar pelo WhatsApp.');return data;
}
