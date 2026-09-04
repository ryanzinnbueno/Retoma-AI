'use client';
import {useState,useRef,useEffect} from 'react';
import {seed,guided,type Workspace} from './business-model';
import type {Config,Lead} from './recovery-model';
type Snapshot={data:Workspace;revision:number};
export function useWorkspace(){
 const [state,setState]=useState<Snapshot>({data:seed(),revision:0}),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const ref=useRef(state),queue=useRef<Promise<unknown>>(Promise.resolve());
 const apply=(s:Snapshot)=>{ref.current=s;setState(s);};
 async function reload(){const r=await fetch('/api/workspace');const s:any=await r.json();if(!r.ok)throw Error(s.error||'Falha ao carregar');apply(s);setReady(true);setError('');}
 useEffect(()=>{reload().catch(e=>setError(e.message));},[]);
 function mutate(fn:(data:Workspace)=>Workspace,retryConflict=false){setSaving(true);setError('');queue.current=queue.current.catch(()=>{}).then(async()=>{
  if(!ref.current.revision)throw Error('Aguarde o carregamento da empresa.');
  for(let attempt=0;attempt<2;attempt++){
   const data=fn(structuredClone(ref.current.data));
   const r=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:ref.current.revision,data})});
   const s:any=await r.json();if(!r.ok){await reload();if(r.status===409&&retryConflict&&attempt===0)continue;throw Error(s.error||'Alterações não salvas.');}apply(s);break;
  }
 }).catch(e=>{setError(e.message);throw e;}).finally(()=>setSaving(false));queue.current.catch(()=>{});}
 return {...state.data,ready,saving,error,reload,apply,flush:()=>queue.current,
 setLeads:(value:Lead[]|((ls:Lead[])=>Lead[]))=>mutate(d=>({...d,leads:typeof value==='function'?value(d.leads):value}),typeof value==='function'),
 setConfig:(config:Config)=>mutate(d=>({...d,config:guided({...config,version:d.config.version+1})}))};
}
