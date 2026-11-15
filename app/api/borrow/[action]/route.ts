import {accountIdentity} from '@/lib/server/accounts';
import {handleApi} from '@/lib/server/api';
import {authenticate,validateOrigin} from '@/lib/auth';
export const dynamic='force-dynamic';
async function handle(request:Request){
  if(!validateOrigin(request,process.env.BORROW_PUBLIC_ORIGIN||new URL(request.url).origin))return Response.json({error:'Cross-origin request rejected'},{status:403});
  const account=accountIdentity(request);
  const identity=account?{userId:account}:await authenticate(request,process.env);
  if(!identity)return Response.json({error:'Sign in or start an isolated demo to open your workspace.',signIn:'/login'},{status:401});
  const canonical=process.env.BORROW_PUBLIC_ORIGIN?new Request(new URL(new URL(request.url).pathname+new URL(request.url).search,process.env.BORROW_PUBLIC_ORIGIN),request):request;
  const response=await handleApi(canonical,{userId:identity.userId,env:process.env});
  if(identity.cookie)response.headers.append('Set-Cookie',identity.cookie);
  response.headers.set('Cache-Control','private, no-store');return response;
}
export const GET=handle;export const POST=handle;
