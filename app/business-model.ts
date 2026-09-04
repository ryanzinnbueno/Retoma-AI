import { initialConfig, initialLeads, normalize, type Config, type Lead } from './recovery-model';
export const availability=['Precisa confirmar','Disponível','Não disponível'] as const;
export type Availability=typeof availability[number];
export const productStates=['Não configurado','Oferecemos','Não oferecemos'] as const;
export const catalogue=[
 ['acm','Fachadas em ACM','Fachadas','Revestimento e identificação de fachadas.'],
 ['letras','Letras-caixa','Fachadas','Identificação com letras em volume.'],
 ['luz','Identificação com iluminação','Fachadas','Identificação visual iluminada.'],
 ['banner','Banners','Impressão e sinalização','Peças impressas para comunicação visual.'],
 ['faixa','Faixas','Impressão e sinalização','Comunicação em formato de faixa.'],
 ['placa','Placas','Impressão e sinalização','Placas de identificação e informação.'],
 ['sinal','Sinalização interna','Impressão e sinalização','Orientação e identificação de ambientes.'],
 ['vitrine','Adesivos para vitrines','Adesivos','Aplicações em vitrines.'],
 ['parede','Adesivos para paredes','Adesivos','Aplicações em paredes.'],
 ['veiculo','Adesivos para veículos','Adesivos','Identificação e comunicação em veículos.'],
 ['piso','Adesivos para pisos','Adesivos','Aplicações em pisos.'],
 ['cartao','Cartões de visita','Outros impressos','Impressos para apresentação e contato.'],
 ['panfleto','Panfletos','Outros impressos','Impressos para divulgação.'],
] as const;
export type Product={id:string;state:typeof productStates[number];materials:string[];finishes:string[];applications:string[];art:Availability|'Padrão da empresa';installation:Availability|'Padrão da empresa';delivery:Availability|'Padrão da empresa';pickup:Availability|'Padrão da empresa';restrictions:string};
export type Business={timezone:string;humanContact:string;humanDays:string;humanStart:string;humanEnd:string;art:Availability;installation:Availability;delivery:Availability;pickup:Availability;payments:string[];products:Product[];autoStart:string;autoEnd:string;autoDays:string[];paused:boolean;extraHandoff:string[]};
export const serviceLabels={art:'Criação / ajuste de arte',installation:'Instalação',delivery:'Entrega',pickup:'Retirada'};
export function defaults():Business{return {timezone:'America/Bahia',humanContact:'',humanDays:'Segunda a sexta',humanStart:'',humanEnd:'',art:'Precisa confirmar',installation:'Precisa confirmar',delivery:'Precisa confirmar',pickup:'Precisa confirmar',payments:[],products:catalogue.map(([id])=>({id,state:'Não configurado',materials:[],finishes:[],applications:[],art:'Padrão da empresa',installation:'Padrão da empresa',delivery:'Padrão da empresa',pickup:'Padrão da empresa',restrictions:''})),autoStart:'09:00',autoEnd:'17:00',autoDays:['Seg','Ter','Qua','Qui','Sex'],paused:false,extraHandoff:[]};}
export function business(config:Config):Business{return config.business||defaults();}
export function guided(config:Config):Config{
 const b=business(config);return {...config,business:b,
 offer:b.products.filter(p=>p.state==='Oferecemos').map(p=>catalogue.find(c=>c[0]===p.id)?.[1]).join('\n'),
 excluded:b.products.filter(p=>p.state==='Não oferecemos').map(p=>catalogue.find(c=>c[0]===p.id)?.[1]).join('\n'),
 objective:'Recuperar conversas autorizadas, esclarecer dúvidas e envolver o vendedor.',
 limits:'Não inventar informações nem prometer condições sem confirmação.',handoff:b.extraHandoff.join(', '),
 knowledge:[],priceHandoff:false,hours:b.humanStart&&b.humanEnd?b.humanDays+' · '+b.humanStart+'–'+b.humanEnd:'Não informado'};
}
export type Workspace={config:Config;leads:Lead[]};
export function seed():Workspace{
 const b=defaults();
 // Only unambiguous selections from the original fictitious company are carried over.
 for(const p of b.products){if(['acm','letras','luz'].includes(p.id))p.state='Oferecemos';if(['cartao','panfleto'].includes(p.id))p.state='Não oferecemos';}
 return {config:guided({...initialConfig,business:b}),leads:initialLeads.map((l,i)=>({...l,reference:String(1041+l.id),valueConfirmed:l.status==='Vendido',productId:null,recoveryPaused:false,messages:l.messages.map((m,j)=>({...m,id:'seed-'+i+'-'+j,delivery:'demo' as const}))}))};
}
export function relevantProducts(config:Config,question:string,lead?:Lead){
 const b=business(config),text=normalize(question+' '+(lead?.service||''));
 const matched=b.products.filter(p=>p.id===lead?.productId||catalogue.find(c=>c[0]===p.id)?.[1].split(' ').some(w=>w.length>3&&text.includes(normalize(w))));
 return matched.slice(0,4).map(p=>({name:catalogue.find(c=>c[0]===p.id)?.[1],...p,
 services:Object.fromEntries(Object.keys(serviceLabels).map(k=>[k,p[k as keyof Product]==='Padrão da empresa'?b[k as keyof Business]:p[k as keyof Product]]))}));
}
export function validateWorkspace(value:unknown):value is Workspace{
 const x=value as Workspace; if(!x||!x.config||!Array.isArray(x.leads)||x.leads.length>100)return false;
 const c=x.config,b=c.business;
 if(!b||!Array.isArray(b.products)||b.products.length!==catalogue.length||new Set(b.products.map(p=>p.id)).size!==catalogue.length)return false;
 if(b.products.some(p=>!catalogue.some(a=>a[0]===p.id)||!productStates.includes(p.state)||!['materials','finishes','applications'].every(k=>Array.isArray(p[k as keyof Product])&&(p[k as keyof Product] as string[]).length<=20&&(p[k as keyof Product] as string[]).every(v=>typeof v==='string'&&v.length<=100))||typeof p.restrictions!=='string'||p.restrictions.length>1000||!Object.keys(serviceLabels).every(k=>[...availability,'Padrão da empresa'].includes(p[k as keyof Product] as any))))return false;
 if(!Object.keys(serviceLabels).every(k=>availability.includes(b[k as keyof Business] as any))||!Array.isArray(b.payments)||!Array.isArray(b.autoDays)||!Array.isArray(b.extraHandoff)||typeof b.paused!=='boolean')return false;
 if(!['company','assistant','region','tone'].every(k=>typeof c[k as keyof Config]==='string'&&String(c[k as keyof Config]).length<=300)||!['humanContact','humanDays','humanStart','humanEnd','autoStart','autoEnd','timezone'].every(k=>typeof b[k as keyof Business]==='string'&&String(b[k as keyof Business]).length<=300))return false;
 try{new Intl.DateTimeFormat('pt-BR',{timeZone:b.timezone})}catch{return false;}
 if(!Array.isArray(c.days)||c.days.length<1||c.days.length>5||c.days.some((d,i)=>!Number.isInteger(d)||d<1||d>90||(i>0&&d<=c.days[i-1])))return false;
 return new Set(x.leads.map(l=>l.id)).size===x.leads.length&&x.leads.every(l=>Number.isSafeInteger(l.id)&&l.id>0&&typeof l.name==='string'&&!!l.name.trim()&&l.name.length<=200&&typeof l.service==='string'&&l.service.length<=300&&typeof l.notes==='string'&&l.notes.length<=6000&&['Parado','Conversando','Vendido','Encerrado'].includes(l.status)&&(l.value===null||(typeof l.value==='number'&&Number.isFinite(l.value)&&l.value>=0))&&typeof l.ai==='boolean'&&typeof l.consent==='boolean'&&typeof l.optOut==='boolean'&&Array.isArray(l.messages)&&l.messages.length<=200&&l.messages.every(m=>['cliente','vendedor','ia'].includes(m.role)&&typeof m.text==='string'&&m.text.length<=6000)&&Array.isArray(l.history)&&l.history.length<=300);
}

