export async function sendWhatsAppMessage(leadId:number,text:string,requestId:string){
 const response=await fetch('/api/whatsapp/outbound',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leadId,text,requestId})});
 const result:any=await response.json();
 if(!response.ok)throw new Error(result.error||'Não foi possível enviar a mensagem pelo WhatsApp.');
 return result;
}
