'use client';
import {useState} from 'react';
import {ArrowUpRight,Loader2} from 'lucide-react';

export default function DemoEntry({children,className,destination='/demo',requireAccount=false}:{children:React.ReactNode;className?:string;destination?:string;requireAccount?:boolean}){
  const[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function enter(){
    if(busy)return;
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/auth/session');
      const session=await response.json() as {authenticated?:boolean;guest?:boolean};
      if(requireAccount&&(!session.authenticated||session.guest)){
        window.location.assign('/login?next='+encodeURIComponent(destination)+'&mode=signup');
        return;
      }
      if(!session.authenticated){
        const guest=await fetch('/api/auth/guest',{method:'POST'});
        if(!guest.ok)throw new Error('Unable to open a workspace. Please sign in.');
      }
      window.location.assign(destination);
    }catch(e){setError(e instanceof Error?e.message:'Unable to connect.');setBusy(false)}
  }
  return <span className="demo-entry"><button className={className} disabled={busy} onClick={enter}>{busy?<Loader2 size={15} className="spin"/>:null}{busy?'Opening your workspace…':children}<ArrowUpRight size={17}/></button>{error&&<span className="demo-entry-error" role="alert">{error} <a href="/login">Sign in</a></span>}</span>;
}
