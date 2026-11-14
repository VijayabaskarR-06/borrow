import {handleApi} from '@/lib/server/api';
import {authenticate,validateOrigin} from '@/lib/auth';
export const dynamic='force-dynamic';
async function handle(request:Request){
  if(!validateOrigin(request))return Response.json({error:'Cross-origin request rejected'},{status:403});
  const identity=await authenticate(request,process.env,false);
  if(!identity)return Response.json({error:'Local demo authentication is not configured'},{status:401});
  const response=await handleApi(request,{userId:identity.userId,env:process.env});
  if(identity.cookie)response.headers.append('Set-Cookie',identity.cookie);
  response.headers.set('Cache-Control','private, no-store');return response;
}
export const GET=handle;export const POST=handle;
