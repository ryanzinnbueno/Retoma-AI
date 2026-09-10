type VercelRequest={method?:string;headers:Record<string,string|string[]|undefined>;query:Record<string,string|string[]|undefined>;body?:unknown};
type VercelResponse={status:(code:number)=>VercelResponse;setHeader:(name:string,value:string)=>void;send:(body:Buffer)=>void;json:(body:unknown)=>void};

export default async function handler(req:VercelRequest,res:VercelResponse){
 const password=process.env.RETOMA_APP_PASSWORD,proxySecret=process.env.RETOMA_PROXY_SECRET,base=process.env.RETOMA_WORKER_URL||'https://retoma-ai.rogerio-ryan4057.workers.dev';
 const supplied=Array.isArray(req.headers['x-retoma-password'])?req.headers['x-retoma-password'][0]:req.headers['x-retoma-password'];
 if(!password||!proxySecret)return res.status(503).json({error:'Configure RETOMA_APP_PASSWORD e RETOMA_PROXY_SECRET na Vercel.'});
 if(supplied!==password)return res.status(401).json({error:'Senha inválida.'});
 const rawPath=Array.isArray(req.query.path)?req.query.path.join('/'):req.query.path||'';
 const target=new URL('/api/'+rawPath,base);for(const [key,value] of Object.entries(req.query)){if(key==='path'||value===undefined)continue;for(const item of Array.isArray(value)?value:[value])target.searchParams.append(key,item);}
 const headers=new Headers({'x-retoma-proxy-secret':proxySecret});const contentType=Array.isArray(req.headers['content-type'])?req.headers['content-type'][0]:req.headers['content-type'];if(contentType)headers.set('content-type',contentType);
 const method=req.method||'GET',body=['GET','HEAD'].includes(method)?undefined:typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 const upstream=await fetch(target,{method,headers,body});const bytes=Buffer.from(await upstream.arrayBuffer());res.status(upstream.status);res.setHeader('content-type',upstream.headers.get('content-type')||'application/json');res.setHeader('cache-control','no-store');res.send(bytes);
}
