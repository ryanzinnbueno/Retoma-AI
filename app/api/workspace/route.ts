import { identity,origin,load,save,json,failure,readBody } from '../../server/store';
export async function GET(req:Request){try{return json(await load(await identity(req)))}catch(e){return failure(e)}}
export async function PUT(req:Request){try{origin(req);const owner=await identity(req);const body=await readBody(req);return json(await save(owner,body.revision,body.data));}catch(e){return failure(e)}}
