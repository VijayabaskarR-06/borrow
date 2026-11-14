import handler from 'vinext/server/fetch-handler';
import { handleApi } from '../lib/server/api';
import { authenticate,validateOrigin } from '../lib/auth';
export default {async fetch(request:Request,env:any,ctx:any){
  if(new URL(request.url).pathname.startsWith('/api/borrow/')){
    if(!validateOrigin(request))return Response.json({error:'Cross-origin request rejected'},{status:403});
    const identity=await authenticate(request,env,true);
    if(!identity)return Response.json({error:'Sign in to open your private workspace',signIn:'/signin-with-chatgpt?return_to=/demo'},{status:401});
    const response=await handleApi(request,{userId:identity.userId,env,db:env.DB});
    if(identity.cookie)response.headers.append('Set-Cookie',identity.cookie);
    response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');
    return response;
  }
  const response=await handler.fetch(request,env,ctx);return response;
}};
