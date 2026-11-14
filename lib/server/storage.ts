import { decrypt, encrypt, randomHex, sha256 } from './crypto';
import { createWorkspace } from './seed';
import type { ApiContext, WorkspaceState } from './models';
export class HttpError extends Error { constructor(public status:number, public code:string, message:string) { super(message); } }
const locks = new Map<string,Promise<unknown>>();
async function exclusive<T>(key:string, fn:()=>Promise<T>):Promise<T> { const prior=locks.get(key)??Promise.resolve(); let release!:()=>void;const gate=new Promise<void>(r=>{release=r}); const tail=prior.catch(()=>{}).then(()=>gate); locks.set(key,tail); await prior.catch(()=>{});try{return await fn()}finally{release();if(locks.get(key)===tail)locks.delete(key);} }
export async function withWorkspace<T>(ctx:ApiContext, fn:(state:WorkspaceState)=>Promise<T>):Promise<T> {
  if(!ctx.userId || ctx.userId.length>256) throw new HttpError(401,'UNAUTHENTICATED','Sign in to open this workspace.');
  const id=`ws_${(await sha256(ctx.userId)).slice(0,24)}`;
  return exclusive(id,async()=>{
    const env=ctx.env??{};
    if(ctx.db) {
      const secret=env.BORROW_MASTER_KEY;
      if(!secret)throw new HttpError(503,'STORAGE_NOT_CONFIGURED','Encrypted storage is not configured.');
      const row=await ctx.db.prepare('SELECT version, payload FROM borrow_workspaces WHERE id = ?').bind(id).first<{version:number;payload:string}>();
      const state=row?await decrypt<WorkspaceState>(row.payload,secret,id):await createWorkspace(ctx.userId);
      if(state.userId!==ctx.userId || state.id!==id)throw new HttpError(403,'WORKSPACE_MISMATCH','Workspace ownership check failed.');
      const result=await fn(state);
      const payload=await encrypt(state,secret,id);
      const changed=row?await ctx.db.prepare('UPDATE borrow_workspaces SET version = ?, payload = ? WHERE id = ? AND version = ?').bind(row.version+1,payload,id,row.version).run():await ctx.db.prepare('INSERT OR IGNORE INTO borrow_workspaces (id, version, payload) VALUES (?, ?, ?)').bind(id,1,payload).run();
      if(changed.meta?.changes!==1)throw new HttpError(409,'CONCURRENT_UPDATE','Workspace changed in another tab. Refresh and try again.');
      return result;
    }
    if(env.BORROW_REQUIRE_D1==='1')throw new HttpError(503,'STORAGE_NOT_CONFIGURED','Persistent storage is unavailable.');
    const fs=await import('node:fs/promises');
    const path=await import('node:path');
    const directory=String(env.BORROW_DATA_DIR??path.join(process.cwd(),'.borrow-data'));
    await fs.mkdir(directory,{recursive:true,mode:0o700});
    let secret=env.BORROW_MASTER_KEY;
    if(!secret){const keyPath=path.join(directory,'master.key');try{secret=(await fs.readFile(keyPath,'utf8')).trim();}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;try{await fs.writeFile(keyPath,randomHex(),{mode:0o600,flag:'wx'});}catch(err){if((err as NodeJS.ErrnoException).code!=='EEXIST')throw err;}secret=(await fs.readFile(keyPath,'utf8')).trim();}}
    const file=path.join(directory,`${id}.json.enc`);
    let state:WorkspaceState;
    try{state=await decrypt<WorkspaceState>(await fs.readFile(file,'utf8'),secret,id);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')state=await createWorkspace(ctx.userId);else throw e;}
    if(state.userId!==ctx.userId || state.id!==id)throw new HttpError(403,'WORKSPACE_MISMATCH','Workspace ownership check failed.');
    const result=await fn(state); const temp=`${file}.${randomHex(8)}.tmp`;
    await fs.writeFile(temp,await encrypt(state,secret,id),{mode:0o600}); await fs.rename(temp,file);return result;
  });
}
