import {scrypt as derive,randomBytes,timingSafeEqual,createHmac} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {encrypt,decrypt,sha256} from './crypto';
const scrypt=promisify(derive);
const TTL=7*24*60*60;
interface Account{id:string;email:string;passwordHash:string;salt:string;createdAt:string}
function secret(){const key=process.env.BORROW_MASTER_KEY;if(!key||!/^[a-f0-9]{64}$/i.test(key))throw new Error('Server authentication is not configured');return key}
function directory(){return path.resolve(process.env.BORROW_DATA_DIR||'.borrow-data','accounts')}
function sign(value:string){return createHmac('sha256',secret()).update('borrow-account-v1:'+value).digest('hex')}
export function sessionCookie(id:string){const value=id+'.'+(Math.floor(Date.now()/1000)+TTL);return `borrow_account=${value}.${sign(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL}${process.env.NODE_ENV==='production'?'; Secure':''}`}
export function accountIdentity(request:Request):string|null{const cookie=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('borrow_account='))?.slice(15);if(!cookie)return null;const [id,expiry,sig,...rest]=cookie.split('.');if(rest.length||!/^([a-f0-9]{64}|guest-[a-f0-9]{48})$/.test(id)||!/^\d{10,11}$/.test(expiry)||Number(expiry)<=Date.now()/1000||!/^[a-f0-9]{64}$/.test(sig||''))return null;const expected=sign(`${id}.${expiry}`);return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex'))?id:null}
const rate=new Map<string,{until:number;count:number}>();
function rateLimit(key:string){const now=Date.now();const old=rate.get(key);if(old&&old.until>now){if(++old.count>12)return false}else rate.set(key,{until:now+60000,count:1});if(rate.size>5000)for(const [k,v]of rate)if(v.until<now)rate.delete(k);return true}
const registrations=new Map<string,Promise<unknown>>();
export async function authApi(request:Request):Promise<Response>{
 const action=new URL(request.url).pathname.split('/').at(-1);const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const respond=(body:unknown,status=200,cookie?:string)=>Response.json(body,{status,headers:{...headers,...cookie?{'Set-Cookie':cookie}:{}}});
 try{
  if(action==='session'&&request.method==='GET'){const id=accountIdentity(request);return respond({authenticated:!!id,guest:id?.startsWith('guest-')??false});}
  if(request.method!=='POST')return respond({error:'Use POST.'},405);
  if(request.headers.get('sec-fetch-site')==='cross-site'||(request.headers.get('origin')&&request.headers.get('origin')!==(process.env.BORROW_PUBLIC_ORIGIN||new URL(request.url).origin)))return respond({error:'Cross-origin requests are rejected.'},403);
  if(action==='signout')return respond({ok:true},200,`borrow_account=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`);
  const ip=request.headers.get('x-real-ip')||'local';if(!rateLimit('ip:'+ip))return respond({error:'Too many attempts. Please wait a minute.'},429);
  if(action==='guest'){const id='guest-'+randomBytes(24).toString('hex');return respond({ok:true,guest:true},200,sessionCookie(id));}
  if(!['signup','signin'].includes(action||''))return respond({error:'Unknown account action.'},404);
  if(Number(request.headers.get('content-length')||0)>4096)return respond({error:'Request too large.'},413);
  const raw=await request.text();if(Buffer.byteLength(raw)>4096)return respond({error:'Request too large.'},413);
  let body:any;try{body=JSON.parse(raw)}catch{return respond({error:'Invalid request.'},400)}
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';const password=body.password;
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<12||Buffer.byteLength(password)>256)return respond({error:'Enter a valid email and a password of 12–256 characters.'},400);
  const id=await sha256(email);if(!rateLimit('email:'+id))return respond({error:'Too many attempts. Please wait a minute.'},429);
  const dir=directory();await mkdir(dir,{recursive:true,mode:0o700});const file=path.join(dir,id+'.enc');
  const prior=registrations.get(id)||Promise.resolve();let release!:()=>void;const gate=new Promise<void>(r=>release=r);const tail=prior.catch(()=>{}).then(()=>gate);registrations.set(id,tail);await prior.catch(()=>{});
  try{
   let account:Account|undefined;try{account=await decrypt<Account>(await readFile(file,'utf8'),secret(),id)}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}
   if(action==='signup'){
    if(account)return respond({error:'Unable to create this account. Try signing in instead.'},409);
    const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64) as Buffer;
    account={id,email,passwordHash:hash.toString('hex'),salt,createdAt:new Date().toISOString()};const temporary=file+'.'+randomBytes(8).toString('hex')+'.tmp';await writeFile(temporary,await encrypt(account,secret(),id),{mode:0o600});await rename(temporary,file);
   }else{
    const hash=await scrypt(password,account?.salt||'invalid-account-placeholder',64) as Buffer;
    if(!account||!timingSafeEqual(hash,Buffer.from(account.passwordHash,'hex')))return respond({error:'Email or password is incorrect.'},401);
   }
   return respond({ok:true,email},200,sessionCookie(id));
  }finally{release();if(registrations.get(id)===tail)registrations.delete(id)}
 }catch(error){console.error('Account request failed:',error instanceof Error?error.name:'unknown');return respond({error:'The account service is unavailable. Please try again.'},503)}
}
