import {AppError,commit,db,failure,identity,load,origin,readBody} from '../../server/store';

export async function DELETE(req:Request){try{
 origin(req);const owner=await identity(req),body=await readBody(req),leadId=Number(body.leadId);
 if(!Number.isSafeInteger(leadId)||leadId<=0)throw new AppError(400,'Conversa inválida.');
 const snapshot=await load(owner),lead=snapshot.data.leads.find(item=>item.id===leadId);
 if(!lead)throw new AppError(404,'Conversa não encontrada.');
 if(snapshot.data.leads.length===1)throw new AppError(409,'Mantenha pelo menos uma conversa no painel.');
 snapshot.data.leads=snapshot.data.leads.filter(item=>item.id!==leadId);
 const saved=await commit(owner,snapshot.revision,snapshot.data);
 await db().prepare('DELETE FROM events WHERE owner=? AND lead_id=?').bind(owner,leadId).run();
 return Response.json(saved,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error)}}
