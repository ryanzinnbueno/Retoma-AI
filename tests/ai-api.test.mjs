import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { initialConfig, initialLeads } from '../app/recovery-model.ts';

async function handler(){
 const source=(await readFile(new URL('../app/api/ai/route.ts',import.meta.url),'utf8'))
 .replace("import { env } from 'cloudflare:workers';","const env={GEMINI_API_KEY:'test-only-not-a-real-key'};")
 .replace("'../../recovery-model'",JSON.stringify(new URL('../app/recovery-model.ts',import.meta.url).href));
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return (await import('data:text/javascript;base64,'+Buffer.from(js+'\n// '+Math.random()).toString('base64'))).POST;
}
const request=(patch={},origin='https://retoma.test')=>new Request('https://retoma.test/api/ai',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({config:initialConfig,question:'Vocês fazem instalação?',...patch})});

test('server validates inputs and conversation authorization before provider calls',async()=>{
 const post=await handler();
 assert.equal((await post(request({},'https://external.test'))).status,403);
 assert.equal((await post(request({question:'a'.repeat(2001)}))).status,400);
 assert.equal((await post(request({lead:initialLeads[0]}))).status,409);
 assert.equal((await post(request({lead:initialLeads[3]}))).status,409);
 assert.equal((await post(request({mode:'followup'}))).status,409);
 assert.equal((await post(new Request('https://retoma.test/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(40001)}))).status,413);
});
test('fixed stop and handoff rules never call Google',async()=>{
 const post=await handler(), original=globalThis.fetch;
 globalThis.fetch=()=>{throw new Error('Unexpected provider call')};
 try{
  const stop=await (await post(request({question:'Não quero receber mais mensagens.'}))).json();
  assert.equal(stop.stop,true);assert.equal(stop.provider,'Regra de segurança');
  const human=await (await post(request({question:'Quero falar com um vendedor.'}))).json();
  assert.ok(human.handoff);
 }finally{globalThis.fetch=original;}
});
test('provider request contains approved context, secret only in header, and validates structured response',async()=>{
 const post=await handler(),original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  assert.match(url,/gemini-3.8-flash:generateContent$/);
  assert.equal(options.headers['x-goog-api-key'],'test-only-not-a-real-key');
  assert.ok(!options.body.includes('test-only-not-a-real-key'));
  const body=JSON.parse(options.body);
  assert.match(body.systemInstruction.parts[0].text,/Forma Comunicação Visual/);
  assert.match(body.contents[0].parts[0].text,/Instalação incluída/);
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({text:'Vamos confirmar a instalação com a equipe.',action:'handoff',reason:'Conferir condições.',summary:'Cliente perguntou sobre instalação.'})}]}}]});
 };
 try{
  const r=await post(request({lead:{...initialLeads[0],ai:true,consent:true}}));
  assert.equal(r.status,200);const data=await r.json();
  assert.equal(data.provider,'Gemini');assert.equal(data.handoff,'Conferir condições.');assert.ok(data.summary);
 }finally{globalThis.fetch=original;}
});
test('quota and malformed model output return explicit errors without canned fallback',async()=>{
 const post=await handler(),original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>Response.json({error:{message:'secret provider detail'}},{status:429});
  let r=await post(request());assert.equal(r.status,429);assert.ok(!(await r.text()).includes('secret provider detail'));
  globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]});
  r=await post(request());assert.equal(r.status,502);
 }finally{globalThis.fetch=original;}
});

