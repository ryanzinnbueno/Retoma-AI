'use client';
import {useEffect,useState} from 'react';
import {shortMessages} from './conversation-tools';
export function MessageBody({text,animate,paused}:{text:string;animate:boolean;paused:boolean}){
 const parts=shortMessages(text);const [count,setCount]=useState(animate?1:parts.length);
 useEffect(()=>{if(!animate){setCount(parts.length);return;}if(paused||count>=parts.length)return;const timer=setTimeout(()=>setCount(n=>n+1),900);return()=>clearTimeout(timer);},[animate,paused,count,parts.length]);
 return <div className="short-message-group">{parts.slice(0,count).map((part,i)=><p className="short-message" key={i}>{part}</p>)}{count<parts.length&&!paused&&<span className="typing-preview" role="status">Assistente digitando<span>…</span></span>}{count<parts.length&&paused&&<small>Prévia interrompida. <button type="button" onClick={()=>setCount(parts.length)}>Ver resposta completa salva</button></small>}</div>;
}
