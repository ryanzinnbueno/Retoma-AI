import {business,relevantProducts} from '../business-model';
import {normalize,type Config,type Lead} from '../recovery-model';
import type {Decision} from './gemini';
export function validateDecision(config:Config,lead:Lead,question:string,result:Decision):Decision{
 if(result.action==='stop'||result.action==='handoff')return result;
 const q=normalize(question);const first=!lead.messages.some(m=>m.role==='ia'&&m.provider==='Gemini');
 const intro=first?'Olá, sou '+config.assistant+', assistente virtual da '+config.company+'. ':'';
 const products=relevantProducts(config,question).filter(p=>p.state!=='Oferecemos');
 let text='',reason='',action:Decision['action']='clarify';
 if(products.length&&/faz|ofere|trabalh|tem|possivel|consegue|voces/.test(q)){
  text=products.map(p=>p.state==='Não oferecemos'?'Não oferecemos '+p.name+'.':'Preciso confirmar com o vendedor se oferecemos '+p.name+'.').join(' ');
  reason='Estado do catálogo validado pelo servidor; não presumir oferta.';
  action=products.some(p=>p.state==='Não configurado')?'handoff':'reply';
 }
 if(/instala/.test(q)&&/inclus|inclui|incluid|cobr|valor|preco/.test(q)){
  text='A disponibilidade de instalação não confirma que ela esteja inclusa. Precisamos validar as condições atuais deste acompanhamento com o vendedor.';
  reason='Inclusão da instalação não confirmada como condição vigente.';action='handoff';
 }
 if(/prazo|quando.*(entreg|pront)|garanti|durabili|vida util|resisten|espess/.test(q)){
  text+=(text?' ':'')+'As condições de prazo, garantia ou desempenho precisam de confirmação específica; não tenho uma informação aprovada para prometer isso.';
  reason='Informação comercial ou técnica crítica não confirmada.';action='handoff';
 }
 return text?{...result,text:intro+text,action,reason,summary:reason,references:[...result.references,'central:output-validation-v1']}:result;
}

