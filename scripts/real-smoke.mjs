import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3000';
const guest=await fetch(base+'/api/auth/guest',{method:'POST',headers:{origin:base}});
assert.equal(guest.status,200,'guest workspace');
const cookie=guest.headers.get('set-cookie')?.split(';')[0];
assert(cookie,'session cookie');
async function call(action,body){
  const response=await fetch(base+'/api/borrow/'+action,{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value=await response.json();
  assert.equal(response.status,200,`${action}: ${JSON.stringify(value)}`);
  return value;
}
const csv='type,vendor,invoiceNumber,date,amount,currency,category,bankAccount\n'+
  'invoice,Example A,A-1,2026-11-01,125.50,USD,Software,SECRET-ACCOUNT\n'+
  'invoice,Example A,A-1,2026-11-01,125.50,USD,Software,SECRET-ACCOUNT\n'+
  'invoice,Example B,B-1,2026-11-02,40.00,USD,Travel,SECRET-ACCOUNT\n'+
  'receipt,Example A,A-1,2026-11-03,125.50,USD,Payment,SECRET-ACCOUNT\n';
let state=await call('upload',{name:'real-check.csv',content:csv,mimeType:'text/csv'});
const ids=state.documents.filter(d=>d.id.startsWith('upload-')).map(d=>d.id);
assert.equal(ids.length,4);
assert.equal(state.mode,'private');
const preview=await fetch(base+'/api/borrow/document?id='+ids[0],{headers:{cookie,origin:base}});
assert.equal(preview.status,200);
assert(!JSON.stringify(await preview.json()).includes('SECRET-ACCOUNT'));
state=await call('propose',{prompt:'Reconcile my expenses',resourceIds:ids});
const taskId=state.activeTaskId;
state=await call('approve',{taskId});
const totalSteps=state.tasks.find(t=>t.id===taskId).totalSteps;
for(let i=0;i<totalSteps;i++)state=await call('step',{taskId});
const task=state.tasks.find(t=>t.id===taskId);
assert.equal(task.status,'completed');
assert.equal(task.report.total,165.5);
assert.equal(task.report.period,'November 2026');
assert.equal(task.report.checks.duplicateInvoices.length,1);
assert.equal(task.report.checks.withoutPaymentEvidence.length,1);
assert.equal(state.leases.find(l=>l.id===task.leaseId).status,'revoked');
state=await call('verify',{receiptId:task.receiptId});
assert.equal(state.latestVerification.valid,true);
console.log('PASS: live CSV import, sensitive-column removal, scoped reconciliation, duplicate/payment checks, closed lease and signed receipt.');
