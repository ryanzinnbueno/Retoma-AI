const token=document.querySelector('#token'),status=document.querySelector('#status');
chrome.storage.local.get('token').then(data=>{if(data.token){token.value=data.token;status.textContent='Extensão vinculada neste navegador.';}});
document.querySelector('#save').addEventListener('click',async()=>{const value=token.value.trim();if(!/^rtm_[a-f0-9]{64}$/.test(value)){status.textContent='Cole o código completo criado no Retoma.';return;}await chrome.storage.local.set({token:value});status.textContent='Vínculo salvo. Abra o WhatsApp Web e clique em Retoma.';});
document.querySelector('#clear').addEventListener('click',async()=>{await chrome.storage.local.remove('token');token.value='';status.textContent='Vínculo removido deste navegador.';});
