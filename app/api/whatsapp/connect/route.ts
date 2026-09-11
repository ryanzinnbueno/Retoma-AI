import {failure,identity,json,origin,readBody} from '../../../server/store';
import {finishEmbeddedSignup} from '../../../server/whatsapp-connection';

export async function POST(request:Request){
 try{
  origin(request);const owner=await identity(request),body=await readBody(request);
  const code=typeof body.code==='string'?body.code:'',wabaId=typeof body.wabaId==='string'?body.wabaId:'',phoneNumberId=typeof body.phoneNumberId==='string'?body.phoneNumberId:'';
  return json(await finishEmbeddedSignup(owner,{code,wabaId,phoneNumberId}));
 }catch(error){return failure(error)}
}
