export type KnowledgeRecord = {
  id: string;
  subject: string;
  concepts: string[];
  questions: string[];
  faq: string[];
  objections: string[];
  limitations: string[];
  handoff: string[];
  source: string;
  reviewedAt: string;
  version: number;
  status: 'approved' | 'draft';
};
export const centralKnowledge: KnowledgeRecord[] = [
  {
    id: 'method-1',
    subject: 'Atendimento',
    concepts: [
      'Responder à pergunta antes de investigar.',
      'Usar o histórico e fazer no máximo duas perguntas por resposta.',
      'Explicar termos técnicos em linguagem simples.',
    ],
    questions: ['Qual informação realmente falta para avançar?'],
    faq: [],
    objections: [
      'Achei caro: investigar se excede o planejado ou se há comparação, sem desconto automático.',
    ],
    limitations: [
      'Não inventar informações, urgência, condições ou benefícios.',
    ],
    handoff: ['Humano solicitado', 'Informação crítica desconhecida'],
    source: 'Especificação da Base de Conhecimento Retoma',
    reviewedAt: '2026-09-14',
    version: 2,
    status: 'approved',
  },
  {
    id: 'method-natural-language',
    subject: 'Linguagem natural',
    concepts: [
      'O cliente não precisa conhecer o nome técnico.',
      'Sinônimos, termos populares, frases e contexto podem indicar um serviço.',
      'Diante de mais de uma possibilidade, perguntar antes de concluir.',
    ],
    questions: [
      'Qual pergunta curta diferencia as possibilidades encontradas?',
    ],
    faq: [],
    objections: [],
    limitations: ['Correspondência aproximada não confirma um produto.'],
    handoff: ['Pedido sem correspondência após esclarecimento'],
    source: 'Especificação da Base de Conhecimento Retoma',
    reviewedAt: '2026-09-14',
    version: 1,
    status: 'approved',
  },
  {
    id: 'method-media',
    subject: 'Fotos e referências',
    concepts: [
      'Pedir foto, logotipo, arte, medidas ou referência quando isso ajudar a entender o projeto.',
    ],
    questions: ['Uma foto ou medida ajudaria a identificar a necessidade?'],
    faq: [],
    objections: [],
    limitations: [
      'Nunca afirmar que analisou um arquivo não recebido.',
      'Não concluir material ou processo quando a imagem não permitir.',
    ],
    handoff: ['Referência insuficiente para decisão técnica'],
    source: 'Especificação da Base de Conhecimento Retoma',
    reviewedAt: '2026-09-14',
    version: 1,
    status: 'approved',
  },
  {
    id: 'method-catalogue-safety',
    subject: 'Catálogo ativo',
    concepts: [
      'Somente serviços ativos em categorias ativas podem ser oferecidos.',
      'Materiais e características vazios são desconhecidos.',
    ],
    questions: [],
    faq: [],
    objections: [],
    limitations: [
      'Não inventar preço, prazo, disponibilidade, garantia, dimensão máxima, instalação ou capacidade de fabricação.',
    ],
    handoff: ['Informação necessária não cadastrada'],
    source: 'Especificação da Base de Conhecimento Retoma',
    reviewedAt: '2026-09-14',
    version: 1,
    status: 'approved',
  },
];
export function retrieveKnowledge(_question: string) {
  return centralKnowledge.filter((r) => r.status === 'approved').slice(0, 4);
}
