export const statuses = ['Parado', 'Conversando', 'Vendido', 'Encerrado'] as const;
export type Status = typeof statuses[number];
export type Message = { role: 'cliente' | 'vendedor' | 'ia'; text: string; kind?: 'quote'; provider?: string; id?:string; delivery?:'demo'|'suggested'; action?:string; references?:string[] };
export type Lead = {
 id: number; name: string; company: string; service: string; value: number|null; date: string; reference?:string; valueConfirmed?:boolean; productId?:string|null; recoveryPaused?:boolean;
 status: Status; ai: boolean; consent: boolean; optOut: boolean; due: string; attempts: number;
 aiSummary?: string; reason: string; needsHuman: boolean; notes: string; messages: Message[]; history: string[];
};
export type Knowledge = { id: number; question: string; answer: string };
export type Config = {
 business?: import('./business-model').Business;
 company: string; assistant: string; region: string; hours: string; offer: string; excluded: string;
 tone: string; objective: string; limits: string; handoff: string; days: number[];
 followups: boolean; priceHandoff: boolean; knowledge: Knowledge[]; version: number;
};
export const initialConfig: Config = {
 company: 'Forma Comunicação Visual', assistant: 'Lia', region: 'Goiânia e região metropolitana',
 hours: 'Segunda a sexta, das 8h às 18h', offer: 'Fachadas em ACM\nLetras-caixa com iluminação LED',
 excluded: 'Impressão de panfletos, cartões de visita e serviços de gráfica rápida.',
 tone: 'Cordial e consultivo', objective: 'Retomar orçamentos enviados, entender dúvidas e objeções e encaminhar oportunidades prontas para o vendedor.',
 limits: 'Não inventar preços ou condições. Não conceder descontos. Não prometer data de instalação sem confirmar com a equipe.',
 handoff: 'Pedido de desconto, alteração do projeto, prazo urgente, reclamação ou pedido para falar com uma pessoa.',
 days: [1, 3, 7], followups: true, priceHandoff: true, version: 1,
 knowledge: [
  {id:1,question:'Vocês fazem instalação?',answer:'Sim, fazemos instalação. O que está incluído depende da proposta aprovada. Vou confirmar as condições do seu projeto com a equipe.'},
  {id:2,question:'Qual a diferença entre ACM e letra-caixa?',answer:'O ACM é usado no revestimento da fachada. A letra-caixa dá volume à identificação da marca e pode receber iluminação LED. Podemos combinar os dois no projeto.'},
 ]
};
export const initialLeads: Lead[] = [
 {id:1,name:'Carlos Mendes',company:'Café do Centro',service:'Fachada em ACM',value:2850,date:'2026-09-01',status:'Parado',ai:false,consent:false,optOut:false,due:'Hoje',attempts:0,reason:'',needsHuman:false,notes:'Fachada de 4 × 1,2 m. Instalação incluída na proposta. Cliente vai avaliar com a sócia.',messages:[{role:'cliente',text:'Oi! Quero renovar a fachada do café. Vocês trabalham com ACM?'},{role:'vendedor',text:'Sim, Carlos! Preparei a proposta com base nas medidas que você enviou. A instalação está incluída.'},{role:'vendedor',text:'Fachada em ACM · 4 × 1,2 m\nR$ 2.850,00 · Orçamento #1042',kind:'quote'},{role:'cliente',text:'Obrigado! Vou olhar com minha sócia e te aviso.'}],history:['Orçamento compartilhado com o cliente.','Aguardando autorização do vendedor para a IA acompanhar.']},
 {id:2,name:'Mariana Costa',company:'Studio MC',service:'Letras-caixa com LED',value:1640,date:'2026-09-02',status:'Conversando',ai:false,consent:true,optOut:false,due:'Ação do vendedor',attempts:1,reason:'Cliente pediu desconto de 10%. Negociação fora da autonomia da IA.',needsHuman:true,notes:'Letreiro para recepção. Cliente gostou do projeto, mas questionou o investimento.',messages:[{role:'vendedor',text:'Mariana, a proposta do letreiro com LED ficou em R$ 1.640,00.',kind:'quote'},{role:'ia',text:'Oi, Mariana! Conseguiu avaliar o letreiro para seu studio? Ficou alguma dúvida?'},{role:'cliente',text:'Gostei bastante! Se fizer 10% de desconto eu fecho hoje.'},{role:'ia',text:'Vou chamar o vendedor para avaliar essa condição com você. Já deixo o contexto para ele.'}],history:['Acompanhamento com IA ativado.','Primeira retomada realizada na simulação.','Vendedor solicitado: negociação de desconto. IA pausada.']},
 {id:3,name:'Rafael Lima',company:'RL Barbearia',service:'Fachada em ACM',value:4200,date:'2026-09-01',status:'Parado',ai:true,consent:true,optOut:false,due:'Hoje',attempts:1,reason:'',needsHuman:false,notes:'Fachada para nova barbearia. Ainda sem confirmação de prazo de abertura.',messages:[{role:'vendedor',text:'Rafael, segue o orçamento da fachada: R$ 4.200,00.',kind:'quote'},{role:'cliente',text:'Recebi! Vou avaliar com calma.'}],history:['Orçamento enviado.','IA autorizada a acompanhar esta conversa.']},
 {id:4,name:'Beatriz Souza',company:'Flora Boutique',service:'Letras-caixa com LED',value:1250,date:'2026-08-29',status:'Vendido',ai:false,consent:true,optOut:false,due:'Concluído',attempts:1,reason:'',needsHuman:false,notes:'Proposta aceita. Vendedor confirmou o fechamento.',messages:[{role:'cliente',text:'Pode fechar! Vamos seguir com o letreiro em LED.'},{role:'vendedor',text:'Combinado! Vou organizar os próximos passos.'}],history:['Cliente confirmou interesse.','Vendedor alterou o status para Vendido.']},
 {id:5,name:'Pedro Alves',company:'Alves Auto',service:'Fachada em ACM',value:3600,date:'2026-09-03',status:'Parado',ai:false,consent:false,optOut:false,due:'Amanhã',attempts:0,reason:'',needsHuman:false,notes:'Proposta enviada. Ainda não iniciou acompanhamento.',messages:[{role:'cliente',text:'Vou avaliar a proposta e te retorno.'}],history:['Orçamento cadastrado.']}
];
export const money=(value:number|null)=>value===null?'Valor não informado':value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
export const terminal=(lead:Lead)=>lead.status==='Vendido'||lead.status==='Encerrado';
export function changeStatus(lead:Lead,status:Status):Lead {
 if(!statuses.includes(status))throw new Error('Status inválido');
 return {...lead,status,ai:(status==='Vendido'||status==='Encerrado')?false:lead.ai,needsHuman:false,
 due:status==='Vendido'||status==='Encerrado'?'Concluído':status==='Conversando'?'Em atendimento':'Hoje',
 history:[...lead.history,`Vendedor alterou o status para ${status}.`]};
}
export function activate(lead:Lead,consent:boolean):Lead {
 if(terminal(lead)||lead.optOut||!consent)throw new Error('Confirme a autorização de contato e use uma conversa aberta.');
 return {...lead,ai:true,consent:true,needsHuman:false,reason:'',due:lead.status==='Parado'?'Hoje':'Aguardando cliente',history:[...lead.history,'Vendedor ativou o acompanhamento da IA com o contexto deste orçamento.']};
}
export function replyTo(text:string,config:Config):{text:string;source:string;handoff?:string;stop?:boolean} {
 const n=normalize(text);
 if(/nao.*(mensag|contato)|pare de|nao tenho interesse|remova|nao me chame/.test(n))return {text:'Entendido. Vou encerrar o acompanhamento e não enviaremos novas retomadas por aqui.',source:'Regra de encerramento',stop:true};
 if(/vendedor|humano|pessoa|atendente|reclam|urgente|fechar|fecho|aceito|pode seguir/.test(n))return {text:'Vou chamar o vendedor e deixar um resumo do que conversamos para você não precisar repetir.',source:'Passagem para o vendedor',handoff:/fechar|fecho|aceito|pode seguir/.test(n)?'Cliente sinalizou fechamento. Confirmar condições e conclusão da venda.':'Cliente solicitou uma pessoa ou trouxe uma situação que precisa de avaliação.'};
 if(/desconto|caro|preco|valor/.test(n)&&config.priceHandoff)return {text:'Entendo seu ponto. Vou chamar o vendedor para avaliar as condições com você. Não consigo alterar o valor do orçamento por conta própria.',source:'Limite de negociação',handoff:'Cliente questionou o investimento ou pediu desconto. Avaliar a negociação.'};
 if(/desconto|caro|preco|valor/.test(n))return {text:'Entendo. O que mais pesou para você na proposta? Posso entender sua necessidade antes de pedir uma avaliação das condições à equipe. Não consigo alterar o valor por conta própria.',source:'Abordagem consultiva sem desconto'};
 const approved=config.knowledge.find(k=>normalize(k.question)===n);
 if(approved)return {text:approved.answer,source:'Exemplo aprovado pela empresa'};
 if(/fazem|trabalham|servicos|oferece/.test(n)&&!(/instala/.test(n)))return {text:`Na ${config.company}, trabalhamos com ${config.offer.split('\n').filter(Boolean).join(' e ')}. ${config.excluded?'Não atendemos: '+config.excluded:''}`,source:'Catálogo e limites de atuação'};
 if(/instala/.test(n)){const k=config.knowledge.find(k=>normalize(k.question).includes('instala'));if(k)return {text:k.answer,source:'Base de conhecimento · instalação'};}
 if(/horario|aberto|atende que horas/.test(n))return {text:`Nosso atendimento é: ${config.hours}.`,source:'Horário da empresa'};
 if(/cidade|regiao|onde atende/.test(n))return {text:`Atendemos ${config.region}.`,source:'Região de atendimento'};
 return {text:'Quero te orientar com a informação certa. Vou encaminhar essa dúvida ao vendedor para confirmar os detalhes do seu projeto.',source:'Dúvida sem resposta aprovada',handoff:'Não há resposta aprovada na base para esta dúvida. Confirmar com o cliente.'};
}
export function receiveMessage(lead:Lead,text:string,config:Config):Lead {
 if(!text.trim()||terminal(lead)||lead.optOut)return lead;
 const result=replyTo(text,config);
 const messages:Message[]=[...lead.messages,{role:'cliente',text:text.trim()}];
 if(result.stop)return {...lead,messages:lead.ai?[...messages,{role:'ia',text:result.text}]:messages,status:'Encerrado',ai:false,optOut:true,needsHuman:false,due:'Não contatar',history:[...lead.history,'Cliente recusou novas mensagens. Acompanhamento encerrado.']};
 if(!lead.ai)return {...lead,messages,status:'Conversando',due:'Ação do vendedor',history:[...lead.history,'Nova mensagem do cliente recebida na simulação.']};
 return {...lead,messages:[...messages,{role:'ia',text:result.text}],status:'Conversando',ai:!result.handoff,needsHuman:!!result.handoff,reason:result.handoff||'',due:result.handoff?'Ação do vendedor':'Aguardando cliente',history:[...lead.history,result.handoff?'IA pausada e vendedor notificado.':'IA respondeu com base nas orientações salvas.']};
}
export function followup(lead:Lead,config:Config):Lead {
 if(!lead.ai||!lead.consent||lead.optOut||terminal(lead)||lead.status!=='Parado'||!config.followups||lead.attempts>=config.days.length)return lead;
 const first=lead.name.split(' ')[0];
 const text=config.tone==='Direto e objetivo'?`${first}, conseguiu avaliar a proposta de ${lead.service.toLowerCase()}? Posso ajudar com alguma dúvida?`:`Oi, ${first}! Tudo bem? Passando para saber se conseguiu avaliar a proposta de ${lead.service.toLowerCase()}. Se ficou alguma dúvida, estou por aqui para ajudar.`;
 return {...lead,attempts:lead.attempts+1,due:lead.attempts+1>=config.days.length?'Limite atingido':`Dia ${config.days[lead.attempts+1]}`,messages:[...lead.messages,{role:'ia',text}],history:[...lead.history,`Retomada ${lead.attempts+1} simulada, seguindo o tom ${config.tone.toLowerCase()}.`]};
}
export function summarize(lead:Lead){
 const last=lead.messages.filter(m=>m.role==='cliente').at(-1)?.text||'Nenhuma resposta registrada.';
 return {interest:`${lead.service} para ${lead.company}. Proposta de ${money(lead.value)}.`,last,
 reason:lead.needsHuman?lead.reason:lead.optOut?'Cliente pediu o encerramento. Não retomar contato.':lead.status==='Vendido'?'Venda confirmada pelo vendedor.':lead.status==='Parado'?'Cliente ainda não retomou a conversa.':lead.reason||'Conversa em andamento, sem nova solicitação ao vendedor.',
 next:lead.optOut?'Respeitar o encerramento.':lead.status==='Vendido'?'Organizar os próximos passos da entrega.':lead.needsHuman?'Assumir a conversa e avaliar o pedido antes de responder.':lead.ai?'Acompanhar respostas e respeitar as regras da empresa.':'Revisar o contexto e decidir se a IA deve acompanhar.'};
}
