const API='https://retoma-ai.rogerio-ryan4057.workers.dev';
const whatsapp=url=>/^https:\/\/web\.whatsapp\.com(?:\/|$)/.test(url||'');
async function broadcastOperator(tabId){
 const tabs=await chrome.tabs.query({url:'https://web.whatsapp.com/*'});
 await Promise.all(tabs.filter(tab=>tab.id).map(tab=>chrome.tabs.sendMessage(tab.id,{type:'retoma-operator-changed',operator:tab.id===tabId}).catch(()=>{})));
}
chrome.tabs.onRemoved.addListener(async tabId=>{const saved=await chrome.storage.local.get('automationTabId');if(saved.automationTabId===tabId){await chrome.storage.local.remove('automationTabId');await broadcastOperator(null);}});
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(message?.type==='retoma-notify'){
  chrome.notifications.create('retoma-'+Date.now(),{type:'basic',iconUrl:'retoma-icon.png',title:message.title||'Retoma precisa de você',message:message.message||'Um cliente pediu atendimento humano.',priority:2});
  sendResponse({ok:true});return;
 }
 if(message?.type==='retoma-operator-status'){
  (async()=>{const {automationTabId}=await chrome.storage.local.get('automationTabId'),tabId=sender.tab?.id||Number(message.tabId)||null;return {configured:!!automationTabId,operator:!!tabId&&automationTabId===tabId,automationTabId};})().then(data=>sendResponse({ok:true,data})).catch(error=>sendResponse({ok:false,error:error.message}));return true;
 }
 if(message?.type==='retoma-set-operator'){
  (async()=>{const tabId=sender.tab?.id||Number(message.tabId),tab=tabId?await chrome.tabs.get(tabId):null;if(!tab?.id||!whatsapp(tab.url))throw new Error('Abra o WhatsApp Web nesta aba antes de ativar o modo operador.');await chrome.storage.local.set({automationTabId:tab.id});await broadcastOperator(tab.id);return {automationTabId:tab.id};})().then(data=>sendResponse({ok:true,data})).catch(error=>sendResponse({ok:false,error:error.message}));return true;
 }
 if(message?.type==='retoma-clear-operator'){
  (async()=>{await chrome.storage.local.remove('automationTabId');await broadcastOperator(null);return {cleared:true};})().then(data=>sendResponse({ok:true,data})).catch(error=>sendResponse({ok:false,error:error.message}));return true;
 }
 if(message?.type!=='retoma-api')return;
 (async()=>{
  const {token}=await chrome.storage.local.get('token');
  if(!token)throw new Error('Abra a extensão e vincule ao Retoma primeiro.');
  const response=await fetch(API+'/api/extension/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(message.payload)});
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('O servidor Retoma não respondeu corretamente. Tente novamente em alguns instantes.');
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível consultar o Retoma.');return data;
 })().then(data=>sendResponse({ok:true,data})).catch(error=>sendResponse({ok:false,error:error.message||'Falha ao consultar o Retoma.'}));
 return true;
});
