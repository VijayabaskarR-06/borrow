import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3000';
let cookie='';
async function call(action,body){const r=await fetch(base+'/api/borrow/'+action,{method:body===undefined?'GET':'POST',headers:{cookie,origin:base,...body!==undefined?{'Content-Type':'application/json'}:{}},body:body===undefined?undefined:JSON.stringify(body)});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const d=await r.json();assert.equal(r.status,200,`${action}: ${JSON.stringify(d)}`);return d;}
for(const route of ['/','/demo','/dashboard','/sources','/assistant','/leases','/security','/receipts','/settings']){const r=await fetch(base+route);assert.equal(r.status,200,route);const html=await r.text();assert.match(html,/BORROW/);}
let s=await call('state');const user=s.workspace.userId;assert.equal(s.documents.length,6);
s=await call('propose',{prompt:'Prepare my October business expense report.'});let task=s.tasks.find(t=>t.id===s.activeTaskId);assert.equal(task.capsule.approvalStatus,'pending');
s=await call('approve',{taskId:task.id,durationSeconds:300});assert.equal(s.trustScore,100);
for(let i=0;i<task.totalSteps;i++)s=await call('step',{taskId:task.id});
task=s.tasks.find(t=>t.id===task.id);assert.equal(task.status,'completed');assert.equal(task.report.total,3784.5);assert(s.events.some(e=>e.reason==='OUTSIDE_APPROVED_SCOPE'));assert.equal(s.leases[0].status,'revoked');assert(!JSON.stringify(task.report).includes('FAKE-PAYROLL-SECRET'));
s=await call('verify',{receiptId:task.receiptId});assert.equal(s.latestVerification.valid,true);
s=await call('verify',{receiptId:task.receiptId,tamper:true});assert.equal(s.latestVerification.valid,false);
s=await call('state');assert.equal(s.workspace.userId,user);assert.equal(s.tasks[0].report.total,3784.5);
s=await call('propose',{prompt:'Prepare October expenses'});task=s.tasks.find(t=>t.id===s.activeTaskId);s=await call('approve',{taskId:task.id});task=s.tasks.find(t=>t.id===task.id);s=await call('revoke',{leaseId:task.leaseId});s=await call('probe',{leaseId:task.leaseId});assert.equal(s.probeResult.reason,'LEASE_REVOKED');
const firstWorkspace=s.workspace.id;cookie='';s=await call('state');assert.notEqual(s.workspace.id,firstWorkspace);assert.equal(s.tasks.length,0);
console.log('PASS: 9 routes; consent → execution → actual attack denial → report → verify/tamper; revoke; refresh persistence; isolated sessions.');
