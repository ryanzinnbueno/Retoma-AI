import {failure,identity,json} from '../../../server/store';
import {connectionForOwner,embeddedSignupPublicConfig} from '../../../server/whatsapp-connection';

export async function GET(request:Request){
 try{
  const owner=await identity(request),connection=await connectionForOwner(owner),signup=embeddedSignupPublicConfig();
  return json({connected:Boolean(connection),credentials:Boolean(connection),webhook:Boolean(connection),channel:'WhatsApp Cloud API',displayPhone:connection?.displayPhone||'',businessName:connection?.businessName||'',signup});
 }catch(error){return failure(error)}
}
