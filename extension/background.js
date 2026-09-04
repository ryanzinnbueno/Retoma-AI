const API='https://retoma-orcamentos-ruben.rogerio-ryan4057.chatgpt.site';
chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
 if(message?.type!=='retoma-api')return;
 (async()=>{
  const {token}=await chrome.storage.local.get('token');
  if(!token)throw new Error('Abra a extensão e vincule ao Retoma primeiro.');
  const response=await fetch(API+'/api/extension/chat',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(message.payload)});
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('Abra o Retoma neste mesmo Chrome, entre na sua conta e tente novamente.');
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível consultar o Retoma.');return data;
 })().then(data=>sendResponse({ok:true,data})).catch(error=>sendResponse({ok:false,error:error.message||'Falha ao consultar o Retoma.'}));
 return true;
});
