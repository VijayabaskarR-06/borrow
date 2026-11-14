import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {authApi,accountIdentity} from '../lib/server/accounts';
import {randomHex} from '../lib/server/crypto';
test('email accounts persist, reject invalid credentials, isolate guests and reject cookie tampering',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'borrow-account-test-'));process.env.BORROW_DATA_DIR=dir;process.env.BORROW_MASTER_KEY=randomHex();
 const call=(action:string,body:unknown={},cookie='')=>authApi(new Request('http://localhost/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost',cookie},body:JSON.stringify(body)}));
 try{
  const email='judge@example.test',password='a unique test password 2026';let r=await call('signup',{email,password});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie')!.split(';')[0];const identity=accountIdentity(new Request('http://localhost',{headers:{cookie}}));assert(identity);
  r=await call('signin',{email,password:'wrong-password-1234'});assert.equal(r.status,401);
  r=await call('signin',{email,password});assert.equal(r.status,200);assert.equal(accountIdentity(new Request('http://localhost',{headers:{cookie:r.headers.get('set-cookie')!.split(';')[0]}})),identity);
  r=await call('signup',{email,password});assert.equal(r.status,409);
  const bad=cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a');assert.equal(accountIdentity(new Request('http://localhost',{headers:{cookie:bad}})),null);
  const guest1=await call('guest'),guest2=await call('guest');const id1=accountIdentity(new Request('http://localhost',{headers:{cookie:guest1.headers.get('set-cookie')!}}));const id2=accountIdentity(new Request('http://localhost',{headers:{cookie:guest2.headers.get('set-cookie')!}}));assert(id1?.startsWith('guest-'));assert.notEqual(id1,id2);assert.notEqual(id1,identity);
  const cross=await authApi(new Request('http://localhost/api/auth/signup',{method:'POST',headers:{origin:'https://attacker.test'},body:JSON.stringify({email,password})}));assert.equal(cross.status,403);
  r=await call('signout');assert.match(r.headers.get('set-cookie')!,/Max-Age=0/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
