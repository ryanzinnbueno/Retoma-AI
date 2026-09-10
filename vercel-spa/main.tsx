import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from '../app/dashboard';
import '../app/globals.css';
import '../app/retoma.css';
import '../app/evolution.css';

const nativeFetch=window.fetch.bind(window);
window.fetch=((input:RequestInfo|URL,init:RequestInit={})=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 if(!url.startsWith('/api/'))return nativeFetch(input,init);
 const headers=new Headers(init.headers);const password=sessionStorage.getItem('retoma-access');if(password)headers.set('x-retoma-password',password);
 return nativeFetch(input,{...init,headers});
}) as typeof window.fetch;

function App(){
 const [password,setPassword]=useState(()=>sessionStorage.getItem('retoma-access')||''),[draft,setDraft]=useState(''),[error,setError]=useState('');
 if(password)return <Dashboard/>;
 return <main className="login-shell"><section className="login-card"><img src="/retoma-logo.png" alt="Retoma"/><span>ACESSO À CENTRAL</span><h1>Bem-vindo ao Retoma</h1><p>Entre com a senha definida para sua empresa.</p><form onSubmit={async event=>{event.preventDefault();setError('');sessionStorage.setItem('retoma-access',draft);const response=await nativeFetch('/api/workspace',{headers:{'x-retoma-password':draft}});if(response.ok)setPassword(draft);else{sessionStorage.removeItem('retoma-access');setError('Senha incorreta ou configuração incompleta.');}}}><label>Senha de acesso<input type="password" value={draft} onChange={event=>setDraft(event.target.value)} autoComplete="current-password" required/></label><button type="submit">Entrar na central</button>{error&&<p role="alert">{error}</p>}</form></section></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
