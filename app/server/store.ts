import { env } from 'cloudflare:workers';
import { seed, guided, validateWorkspace, type Workspace } from '../business-model';
export class AppError extends Error{constructor(public status:number,message:string){super(message)}}
export function db(){const binding=(env as unknown as {DB?:D1Database}).DB;if(!binding)throw new AppError(503,'Armazenamento indisponível.');return binding;}
export function identity(req:Request){const id=req.headers.get('oai-authenticated-user-id');if(id)return id;if(import.meta.env.DEV&&['localhost','127.0.0.1'].includes(new URL(req.url).hostname))return 'local-demo';throw new AppError(401,'Entre na sua conta para acessar esta empresa.');}
export function origin(req:Request){const o=req.headers.get('origin');if(o&&o!==new URL(req.url).origin)throw new AppError(403,'Origem não autorizada.');}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function failure(e:unknown){return json({error:e instanceof AppError?e.message:'Não foi possível concluir. Nenhum envio real foi realizado.'},e instanceof AppError?e.status:500);}
export async function readBody(req:Request){if(!req.headers.get('content-type')?.includes('application/json'))throw new AppError(415,'Envie JSON.');const reader=req.body?.getReader();if(!reader)throw new AppError(400,'Dados ausentes.');let text='',size=0;const decoder=new TextDecoder();while(true){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>700000){await reader.cancel();throw new AppError(413,'Dados excedem o limite de teste.');}text+=decoder.decode(p.value,{stream:true});}try{return JSON.parse(text+decoder.decode())}catch{throw new AppError(400,'Dados inválidos.')}}
export async function load(owner:string){await db().prepare('INSERT OR IGNORE INTO workspaces(owner,data,revision) VALUES(?,?,1)').bind(owner,JSON.stringify(seed())).run();const row=await db().prepare('SELECT data,revision FROM workspaces WHERE owner=?').bind(owner).first<{data:string;revision:number}>();if(!row)throw new AppError(404,'Empresa não encontrada.');return {data:JSON.parse(row.data) as Workspace,revision:row.revision};}
export async function commit(owner:string,revision:number,data:Workspace){
 const r=await db().prepare('UPDATE workspaces SET data=?,revision=revision+1 WHERE owner=? AND revision=?').bind(JSON.stringify(data),owner,revision).run();
 if(!r.meta.changes)throw new AppError(409,'A conversa ou configuração mudou. Atualize e tente novamente.');
 return {data,revision:revision+1};
}
export async function save(owner:string,revision:number,data:Workspace){
 if(!validateWorkspace(data))throw new AppError(400,'Revise os campos e limites do formulário.');
 const current=await load(owner);if(current.revision!==revision)throw new AppError(409,'Existem alterações mais recentes. Atualize a página.');
 data.config=guided(data.config);
 // Opt-out is irreversible through generic writes. Message IDs from the server cannot be erased.
 for(const previous of current.data.leads){const next=data.leads.find(l=>l.id===previous.id);if(!next)throw new AppError(400,'Não é permitido apagar acompanhamentos nesta etapa.');if(previous.optOut){next.optOut=true;next.ai=false;next.recoveryPaused=true;}if(next.status==='Vendido'||next.status==='Encerrado')next.ai=false;
 if(previous.messages.some(m=>m.id&&!next.messages.some(n=>n.id===m.id&&JSON.stringify(n)===JSON.stringify(m))))throw new AppError(409,'Não é permitido sobrescrever mensagens registradas.');
 for(const message of next.messages){if(!previous.messages.some(m=>m.id&&m.id===message.id)){if(message.role!=='vendedor')throw new AppError(400,'Mensagens automáticas devem passar pelo processamento do servidor.');message.id=crypto.randomUUID();message.delivery='demo';}}
 next.attempts=Math.max(previous.attempts,next.attempts);if(!next.consent)next.ai=false;
 }
 return commit(owner,revision,data);
}
