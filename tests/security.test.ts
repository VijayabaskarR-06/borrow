import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleApi } from '../lib/server/api';
import type { ApiContext, GatewayRequest, WorkspaceState } from '../lib/server/models';
import { withWorkspace } from '../lib/server/storage';
import { authorize, verifyEventChain } from '../lib/server/policy';
import { canonical, sha256, encrypt, randomHex } from '../lib/server/crypto';
import { verifyReceipt } from '../lib/server/receipts';
import type { WorkspaceSnapshot } from '../lib/contracts';
async function setup(extraEnv:Record<string,string>={}){const dir=await mkdtemp(join(tmpdir(),'borrow-test-'));const ctx:ApiContext={userId:`judge-${crypto.randomUUID()}`,env:{BORROW_DATA_DIR:dir,...extraEnv}};
  async function call(action:string,body?:unknown){const response=await handleApi(new Request(`http://localhost/api/borrow/${action}`,body===undefined?undefined:{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost'},body:JSON.stringify(body)}),ctx);return {response,data:await response.json() as WorkspaceSnapshot};}
  let result=await call('propose',{prompt:'Prepare my October business expense report.'});assert.equal(result.response.status,200);const taskId=result.data.activeTaskId;
  result=await call('approve',{taskId});assert.equal(result.response.status,200);const leaseId=result.data.leases[0].id;
  const state=await withWorkspace(ctx,async s=>structuredClone(s));
  const request:GatewayRequest={userId:ctx.userId,workspaceId:state.id,leaseId,resourceId:'invoice-001',operation:'read',fields:['vendor','amount'],destination:'workspace:report'};
  return {dir,ctx,call,state,request,taskId,leaseId,cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('approved read returns only approved fields and appends a verifiable decision',async()=>{const s=await setup();try{const r=await authorize(s.state,s.request);assert.equal(r.decision,'ALLOW');assert.deepEqual(r.data,{vendor:'Orbit Studio',amount:1840});assert.equal(await verifyEventChain(s.state.events),true);}finally{await s.cleanup();}});
test('unapproved payroll resource is denied by the gateway, without any data',async()=>{const s=await setup();try{const r=await authorize(s.state,{...s.request,resourceId:'payroll-001'});assert.equal(r.reason,'OUTSIDE_APPROVED_SCOPE');assert.equal(r.decision,'DENY');assert.equal(r.data,undefined);assert.deepEqual(s.state.events.at(-1)?.fields,[]);}finally{await s.cleanup();}});
test('lease expiry is checked on every protected operation',async()=>{const s=await setup();try{const r=await authorize(s.state,{...s.request,now:Date.now()+901000});assert.equal(r.reason,'LEASE_EXPIRED');assert.equal(r.data,undefined);}finally{await s.cleanup();}});
test('revoking a lease immediately denies subsequent reads',async()=>{const s=await setup();try{await s.call('revoke',{leaseId:s.leaseId});const r=await s.call('probe',{leaseId:s.leaseId});assert.equal(r.data.probeResult?.decision,'DENY');assert.equal(r.data.probeResult?.reason,'LEASE_REVOKED');}finally{await s.cleanup();}});
test('workspace and authenticated-user boundaries deny cross-tenant requests',async()=>{const s=await setup();try{for(const changed of [{userId:'other-user'},{workspaceId:'other-workspace'}]){const r=await authorize(s.state,{...s.request,...changed});assert.equal(r.reason,'WORKSPACE_MISMATCH');assert.equal(r.data,undefined);}}finally{await s.cleanup();}});
test('restricted fields, operations and destinations fail closed',async()=>{const s=await setup();try{for(const [changed,reason] of [[{fields:['bankAccount']},'FIELD_NOT_ALLOWED'],[{operation:'delete'},'OPERATION_NOT_ALLOWED'],[{destination:'https://outside.example.invalid'},'DESTINATION_NOT_ALLOWED']] as const){const r=await authorize(s.state,{...s.request,...changed,fields:'fields'in changed?[...changed.fields]:s.request.fields});assert.equal(r.reason,reason);assert.equal(r.data,undefined);}}finally{await s.cleanup();}});
test('modifying a signed lease cannot expand its resources',async()=>{const s=await setup();try{s.state.leases[0].resourceIds.push('payroll-001');const r=await authorize(s.state,{...s.request,resourceId:'payroll-001'});assert.equal(r.reason,'INVALID_LEASE_SIGNATURE');}finally{await s.cleanup();}});
test('client cannot self-approve scope or access before approval',async()=>{const dir=await mkdtemp(join(tmpdir(),'borrow-pending-'));try{const ctx={userId:'pending-judge',env:{BORROW_DATA_DIR:dir}};const call=(action:string,body:unknown)=>handleApi(new Request(`http://localhost/api/borrow/${action}`,{method:'POST',body:JSON.stringify(body)}),ctx);const p=await (await call('propose',{prompt:'October expenses',approvalStatus:'approved',allowedFields:['bankAccount']})).json() as WorkspaceSnapshot;assert.equal(p.tasks[0].capsule.approvalStatus,'pending');assert.ok(!p.tasks[0].capsule.allowedFields.includes('bankAccount'));assert.equal((await call('step',{taskId:p.activeTaskId})).status,409);assert.equal((await call('propose',{prompt:'October expenses',resourceIds:['payroll-001']})).status,400);}finally{await rm(dir,{recursive:true,force:true});}});
test('full workflow blocks injection, deduplicates payment, signs report, revokes and persists',async()=>{const s=await setup();try{let latest:WorkspaceSnapshot;for(let i=0;i<6;i++){const r=await s.call('step',{taskId:s.taskId});assert.equal(r.response.status,200);latest=r.data;if(i===4){assert.equal(latest.coreState,'ACCESS_DENIED');assert.equal(latest.probeResult?.reason,'OUTSIDE_APPROVED_SCOPE');}}
  const task=latest!.tasks.find(t=>t.id===s.taskId)!;assert.equal(task.status,'completed');assert.equal(task.report?.total,3784.5);assert.equal(task.report?.items.length,3);assert.equal(task.report?.mode,'demo');assert.equal(latest!.leases[0].status,'revoked');assert.equal(latest!.receipts.length,1);
  const original=latest!.receipts[0];const verification=await verifyReceipt(original,original.publicKey);assert.equal(verification.valid,true);
  const fresh=await s.call('state');assert.equal(fresh.data.tasks[0].report?.total,3784.5);assert.equal(fresh.data.receipts[0].hash,original.hash);assert.equal('privateKey' in fresh.data,false);assert.equal('content' in fresh.data.documents[0],false);
  const encryptedFile=(await readdir(s.dir)).find(n=>n.endsWith('.enc'))!;const encrypted=await readFile(join(s.dir,encryptedFile),'utf8');assert.ok(!encrypted.includes('Orbit Studio'));assert.ok(!encrypted.includes('privateKey'));assert.ok(!encrypted.includes('17700'));
}finally{await s.cleanup();}});
test('receipt tampering and hash replacement fail independent verification',async()=>{const s=await setup();try{for(let i=0;i<6;i++)await s.call('step',{taskId:s.taskId});const state=(await s.call('state')).data as WorkspaceSnapshot;const original=state.receipts[0];const altered=structuredClone(original);altered.payload.completionStatus='forged';const result=await verifyReceipt(altered,original.publicKey);assert.equal(result.valid,false);assert.equal(result.hashValid,false);altered.hash=await sha256(canonical(altered.payload));const replacedHash=await verifyReceipt(altered,original.publicKey);assert.equal(replacedHash.hashValid,true);assert.equal(replacedHash.signatureValid,false);altered.payload.events=[null];assert.equal((await verifyReceipt(altered,original.publicKey)).chainValid,false);
  const apiTest=await s.call('verify',{receiptId:original.id,tamper:true});assert.equal(apiTest.data.latestVerification?.valid,false);const apiValid=await s.call('verify',{receiptId:original.id});assert.equal(apiValid.data.latestVerification?.valid,true);assert.equal(apiValid.data.coreState,'RECEIPT_VERIFIED');
}finally{await s.cleanup();}});
test('invalid identity, cross-origin writes and oversized uploads are rejected',async()=>{const s=await setup();try{const missing=await handleApi(new Request('http://localhost/api/borrow/state'),{userId:''});assert.equal(missing.status,401);const cross=await handleApi(new Request('http://localhost/api/borrow/reset',{method:'POST',headers:{origin:'https://attacker.invalid'},body:'{}'}),s.ctx);assert.equal(cross.status,403);const upload=await s.call('upload',{name:'bad.exe',content:'executable',mimeType:'application/octet-stream'});assert.equal(upload.response.status,400);const large=await s.call('upload',{name:'large.txt',content:'x'.repeat(100001),mimeType:'text/plain'});assert.equal(large.response.status,400);}finally{await s.cleanup();}});

test('revocation is not blocked by in-flight AI inference, and its result cannot publish',async()=>{
  const s=await setup({OPENAI_API_KEY:'test-placeholder-not-a-real-key'});const originalFetch=globalThis.fetch;let release!:()=>void;let started!:()=>void;const isStarted=new Promise<void>(r=>{started=r});const waiting=new Promise<void>(r=>{release=r});
  try{
    for(let i=0;i<5;i++)await s.call('step',{taskId:s.taskId});
    const before=(await s.call('state')).data;assert.ok(before.tasks[0].capsule.outputDestinations.includes('provider:openai'));
    globalThis.fetch=(async()=>{started();await waiting;return Response.json({output:[{content:[{type:'output_text',text:'Approved expense summary.'}]}]});}) as typeof fetch;
    const pending=s.call('step',{taskId:s.taskId});await isStarted;
    const revoked=await Promise.race([s.call('revoke',{leaseId:s.leaseId}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Revocation waited for inference')),1500))]);
    assert.equal(revoked.data.leases[0].status,'revoked');release();const finished=await pending;
    assert.equal(finished.data.probeResult?.reason,'LEASE_REVOKED');assert.equal(finished.data.tasks[0].report,undefined);assert.equal(finished.data.receipts.length,0);
  }finally{release?.();globalThis.fetch=originalFetch;await s.cleanup();}
});
test('failed D1 CAS does not start the external provider handoff',async()=>{
  const s=await setup({OPENAI_API_KEY:'test-placeholder-not-a-real-key'});const originalFetch=globalThis.fetch;let calls=0;
  try{for(let i=0;i<5;i++)await s.call('step',{taskId:s.taskId});const state=await withWorkspace(s.ctx,async state=>structuredClone(state));const key=randomHex();const payload=await encrypt(state,key,state.id);
    const db={prepare:(_sql:string)=>({bind(..._args:unknown[]){return this},async first<T>(){return {version:1,payload} as T},async run(){return {meta:{changes:0}}}})};
    globalThis.fetch=(async()=>{calls++;throw new Error('Must not call provider before successful CAS');}) as typeof fetch;
    const response=await handleApi(new Request('http://localhost/api/borrow/step',{method:'POST',body:JSON.stringify({taskId:s.taskId})}),{userId:s.ctx.userId,env:{BORROW_MASTER_KEY:key,OPENAI_API_KEY:'test-placeholder-not-a-real-key'},db});
    assert.equal(response.status,409);assert.equal(calls,0);
  }finally{globalThis.fetch=originalFetch;await s.cleanup();}
});
test('receipt envelope identifiers cannot be relabeled while preserving a valid payload',async()=>{const s=await setup();try{for(let i=0;i<6;i++)await s.call('step',{taskId:s.taskId});const original=(await s.call('state')).data.receipts[0];const changed={...original,taskId:'different-task'};const checked=await verifyReceipt(changed,original.publicKey);assert.equal(checked.valid,false);assert.equal(checked.signatureValid,false);}finally{await s.cleanup();}});
test('configured AI gets only approved data and publishes only through the renewed output check',async()=>{
  const s=await setup({OPENAI_API_KEY:'test-placeholder-not-a-real-key'});const originalFetch=globalThis.fetch;let sent='';
  try{globalThis.fetch=(async(_url:unknown,init?:RequestInit)=>{sent=String(init?.body);return Response.json({output:[{content:[{type:'output_text',text:'October approved expenses total $3,784.50.'}]}]});}) as typeof fetch;
    let snapshot:WorkspaceSnapshot|undefined;for(let i=0;i<6;i++)snapshot=(await s.call('step',{taskId:s.taskId})).data;
    assert.equal(snapshot?.tasks[0].report?.mode,'ai');assert.equal(snapshot?.tasks[0].status,'completed');assert.equal(snapshot?.receipts.length,1);assert.ok(sent.includes('Orbit Studio'));assert.ok(!sent.includes('SYNTHETIC-ACCT'));assert.ok(!sent.includes('17700'));assert.ok(!sent.includes('Alex Chen'));assert.ok(snapshot?.events.some(e=>e.operation==='analyze'&&e.destination==='provider:openai'&&e.decision==='ALLOW'));
  }finally{globalThis.fetch=originalFetch;await s.cleanup();}
});
test('upload size is enforced in UTF-8 bytes, not just characters',async()=>{const s=await setup();try{const upload=await s.call('upload',{name:'multibyte.txt',content:'é'.repeat(50001),mimeType:'text/plain'});assert.equal(upload.response.status,400);}finally{await s.cleanup();}});
