export type CatalogueDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  synonyms: string[];
  popularTerms: string[];
  clientPhrases: string[];
  keywords: string[];
  variations: string[];
  characteristics: string[];
  environments: string[];
  qualificationQuestions: string[];
  relatedServices: string[];
  aiInstructions: string;
};

type CategorySeed = {
  category: string;
  description: string;
  services: string;
  questions: string[];
  related?: string[];
  environments?: string[];
};

const seeds: CategorySeed[] = [
  {
    category: 'Fachadas',
    description:
      'Revestimento, identificação e revitalização da frente de imóveis.',
    services:
      'Fachada em ACM|Fachada comercial|Revestimento em ACM|Fachada com estrutura metálica|Fachada em lona|Fachada em acrílico|Fachada em PVC|Fachada em chapa galvanizada|Fachada em aço ou inox|Fachada em vidro|Fachada adesivada|Fachada iluminada|Fachada com LED|Fachada frontlight|Fachada backlight|Fachada com letra caixa|Fachada com logotipo|Testeira comercial|Marquise|Revestimento de marquise|Revestimento de pilares|Revestimento de colunas|Pórtico de entrada|Revitalização de fachada|Reforma de fachada',
    questions: [
      'É para comércio, empresa ou residência?',
      'A fachada já existe?',
      'Qual a largura e a altura aproximadas?',
      'Pode enviar uma foto do local?',
      'Deseja iluminação?',
      'Já possui logotipo ou arte?',
    ],
    related: [
      'Letra caixa',
      'Logotipo iluminado',
      'Adesivação de vitrine',
      'Totem externo',
      'Sinalização externa',
    ],
    environments: ['fachada externa', 'entrada de loja', 'prédio comercial'],
  },
  {
    category: 'Letreiros, letras caixa e letras 3D',
    description: 'Identificação em volume, relevo ou com iluminação.',
    services:
      'Letra caixa|Letra 3D|Letra em relevo|Letra caixa iluminada|Letra caixa sem iluminação|Letra caixa em ACM|Letra caixa em acrílico|Letra caixa em PVC expandido|Letra caixa em inox|Letra caixa em aço galvanizado|Letra caixa em alumínio|Letras recortadas|Logotipo 3D|Logotipo em relevo|Logotipo iluminado|Letreiro comercial|Letreiro luminoso|Letreiro LED|Iluminação frontal|Iluminação traseira|Backlight|Efeito halo|Neon LED|Neon flex',
    questions: [
      'Onde será instalado?',
      'Qual o tamanho aproximado?',
      'Será em ambiente interno ou externo?',
      'Deseja iluminação?',
      'Pode enviar o logotipo e uma foto do local?',
    ],
    related: ['Fachada em ACM', 'Sinalização interna'],
    environments: ['fachada externa', 'recepção', 'ambiente interno'],
  },
  {
    category: 'Placas e sinalização',
    description:
      'Identificação, orientação, informação, segurança e acessibilidade.',
    services:
      'Placa comercial|Placa empresarial|Placa de identificação|Placa direcional|Placa informativa|Placa de segurança|Placa de emergência|Placa de saída|Placa de acessibilidade|Placa de estacionamento|Placa de setores|Placa de salas|Placa de portas|Placa para banheiro|Placa para condomínio|Placa industrial|Placa hospitalar|Placa escolar|Placa imobiliária|Placa de obra|Sinalização interna|Sinalização externa|Sinalização corporativa',
    questions: [
      'Onde será instalada?',
      'O uso é interno ou externo?',
      'Qual o tamanho aproximado?',
      'Precisa ser iluminada?',
      'Já possui a arte?',
    ],
    related: ['Totem direcional', 'Letras recortadas'],
    environments: [
      'ambiente interno',
      'ambiente externo',
      'condomínio',
      'empresa',
    ],
  },
  {
    category: 'Totens e pórticos',
    description:
      'Estruturas verticais de identificação, direção ou publicidade.',
    services:
      'Totem externo|Totem interno|Totem comercial|Totem empresarial|Totem de identificação|Totem direcional|Totem publicitário|Totem luminoso|Totem não luminoso|Totem dupla face|Totem em ACM|Totem metálico|Totem de preços|Totem promocional|Totem digital|Pórtico|Portal de entrada',
    questions: [
      'Qual a finalidade do totem?',
      'Onde será instalado?',
      'Qual o tamanho aproximado?',
      'Deseja iluminação?',
      'Será visto por um lado ou pelos dois?',
    ],
    related: ['Placa comercial', 'Estrutura metálica'],
    environments: ['entrada', 'área externa', 'recepção'],
  },
  {
    category: 'Impressão digital e grandes formatos',
    description: 'Impressos promocionais e comunicação em grande formato.',
    services:
      'Banner|Faixa|Lona|Lona frontlight|Lona backlight|Cartaz|Pôster|Adesivo impresso|Vinil|Painel impresso|Impressão para display|Impressão para PDV|Impressão de grande formato|Material promocional impresso',
    questions: [
      'Qual o tamanho e a quantidade?',
      'Onde o material será usado?',
      'Já possui a arte?',
      'Qual a data necessária?',
    ],
    related: ['Display de balcão', 'Adesivo promocional'],
  },
  {
    category: 'Adesivos',
    description:
      'Produção e aplicação de adesivos para comunicação, decoração e identificação.',
    services:
      'Adesivo impresso|Adesivo de recorte|Adesivo transparente|Adesivo branco|Adesivo perfurado|Adesivo jateado|Adesivo refletivo|Adesivo promocional|Adesivo decorativo|Adesivo para parede|Adesivo para piso|Adesivo para vidro|Adesivo para vitrine|Adesivo para portas|Adesivo com logotipo|Adesivo com QR Code',
    questions: [
      'Em qual superfície será aplicado?',
      'Qual o tamanho aproximado?',
      'É para ambiente interno ou externo?',
      'Já possui a arte?',
      'Pode enviar uma foto do local?',
    ],
    related: ['Impressão de grande formato', 'Adesivação de vitrine'],
  },
  {
    category: 'Envelopamento e adesivação de veículos',
    description:
      'Identificação e comunicação visual aplicada em veículos e frotas.',
    services:
      'Envelopamento total|Envelopamento parcial|Adesivação comercial|Plotagem de veículo|Identificação de frota|Logotipo em veículo|Adesivação promocional|Adesivação de carro|Adesivação de moto|Adesivação de van|Adesivação de caminhão|Adesivação de ônibus|Adesivação de baú|Adesivação de reboque|Adesivação de food truck|Adesivação de máquinas e equipamentos|Adesivação de frota empresarial|Remoção de adesivos antigos',
    questions: [
      'Qual é o veículo?',
      'Deseja envelopamento total ou somente identificação da empresa?',
      'Possui arte ou logotipo?',
      'Pode enviar fotos do veículo?',
    ],
    related: [
      'Adesivo de recorte',
      'Adesivo impresso',
      'Identificação de frota',
    ],
  },
  {
    category: 'Vitrines e vidros',
    description:
      'Comunicação e acabamento visual para vitrines, portas e superfícies de vidro.',
    services:
      'Adesivação de vitrine|Envelopamento de vitrine|Adesivo promocional para vitrine|Adesivo perfurado para vidro|Adesivo transparente para vidro|Adesivo jateado para vidro|Adesivo de recorte para vidro|Adesivo impresso para vidro|Película decorativa|Faixa de segurança para vidro|Logotipo em vidro|Horário de funcionamento em vidro|QR Code em vidro|Campanha promocional para vitrine|Decoração sazonal de vitrine|Comunicação para portas de vidro',
    questions: [
      'É vitrine, porta ou outro vidro?',
      'Qual o tamanho aproximado?',
      'Deseja privacidade ou manter visibilidade?',
      'Pode enviar uma foto?',
      'Já possui a arte?',
    ],
    related: ['Adesivo jateado', 'Adesivo de recorte'],
  },
  {
    category: 'Comunicação visual interna e ambientação',
    description: 'Identidade e orientação visual em ambientes internos.',
    services:
      'Ambientação corporativa|Adesivação de paredes|Painel decorativo|Painel institucional|Logotipo para recepção|Letreiro interno|Letras 3D internas|Identificação de ambientes|Identificação de setores|Identificação de salas|Comunicação de corredores|Comunicação para escritórios|Comunicação para clínicas|Comunicação para lojas|Comunicação para escolas|Comunicação para hotéis|Comunicação para hospitais|Comunicação para academias|Comunicação para restaurantes',
    questions: [
      'Qual ambiente será trabalhado?',
      'Qual a área ou medida aproximada?',
      'Pode enviar fotos do local?',
      'Já possui identidade visual?',
    ],
    related: ['Sinalização interna', 'Logotipo 3D'],
  },
  {
    category: 'PDV e displays',
    description: 'Exposição de produtos, preços e campanhas no ponto de venda.',
    services:
      'Display de balcão|Display de chão|Display de parede|Display em acrílico|Display em PVC|Display em MDF|Display iluminado|Expositor|Expositor personalizado|Porta-folheto|Porta-cartão|Porta-preço|Porta-menu|Stopper|Wobbler|Testeira de gôndola|Cubo promocional|Urna promocional|Balcão promocional|Totem promocional para PDV|Material para campanha|Comunicação de ponto de venda',
    questions: [
      'Qual produto ou informação será exibido?',
      'Onde será colocado?',
      'Qual a quantidade e o tamanho?',
      'Já possui a arte?',
    ],
    related: ['Impressão para PDV', 'Totem promocional'],
  },
  {
    category: 'Router CNC',
    description: 'Corte e usinagem computadorizada de peças e chapas.',
    services:
      'Corte CNC|Usinagem CNC|Corte de ACM|Corte de PVC|Corte de PVC expandido|Corte de MDF|Corte de madeira|Corte de acrílico em CNC|Letras recortadas em CNC|Logotipo em CNC|Placa em CNC|Painel vazado|Peça personalizada em CNC|Molde em CNC|Gabarito em CNC|Protótipo em CNC|Produção seriada em CNC|Projeto personalizado em CNC',
    questions: [
      'Qual material e espessura?',
      'Possui arquivo de corte ou desenho?',
      'Qual a medida e quantidade?',
      'Qual acabamento precisa?',
    ],
    related: ['Letras recortadas', 'Peça personalizada'],
  },
  {
    category: 'Corte e gravação a laser',
    description: 'Corte, gravação e personalização a laser.',
    services:
      'Corte a laser|Gravação a laser|Corte de acrílico a laser|Corte de MDF a laser|Corte de madeira a laser|Gravação de logotipo|Gravação de nomes|Placa personalizada a laser|Peça personalizada a laser|Chaveiro personalizado|Troféu a laser|Medalha a laser|Display a laser|Identificação de peças|Produção personalizada a laser',
    questions: [
      'Qual material será utilizado?',
      'O serviço é corte, gravação ou ambos?',
      'Qual a medida e quantidade?',
      'Possui arquivo ou arte?',
    ],
    related: ['Troféu personalizado', 'Placa de homenagem'],
  },
  {
    category: 'Impressão 3D',
    description:
      'Produção tridimensional de protótipos, suportes e peças especiais.',
    services:
      'Peça personalizada em impressão 3D|Protótipo em impressão 3D|Letra em impressão 3D|Logotipo em impressão 3D|Elemento tridimensional|Suporte em impressão 3D|Componente especial em impressão 3D|Peça para comunicação visual em impressão 3D',
    questions: [
      'Qual é a finalidade da peça?',
      'Possui modelo 3D ou medidas?',
      'Qual a quantidade?',
      'Pode enviar uma referência?',
    ],
    related: ['Protótipo em CNC', 'Peça personalizada em CNC'],
  },
  {
    category: 'Troféus e peças personalizadas',
    description: 'Reconhecimento, homenagem e peças especiais sob medida.',
    services:
      'Troféu|Troféu em acrílico|Troféu em MDF|Troféu personalizado|Placa de homenagem|Medalha|Peça comemorativa|Brinde produzido por corte ou gravação|Peça especial personalizada',
    questions: [
      'Qual o evento ou finalidade?',
      'Qual a quantidade?',
      'Possui referência, texto ou logotipo?',
      'Qual a data necessária?',
    ],
    related: ['Gravação a laser', 'Corte de acrílico a laser'],
  },
  {
    category: 'Eventos',
    description:
      'Estruturas e comunicação visual para eventos, feiras e ativações.',
    services:
      'Backdrop|Painel para fotos|Painel para eventos|Banner para evento|Faixa para evento|Totem para evento|Sinalização para evento|Comunicação para stand|Comunicação para feira|Balcão promocional para evento|Letra gigante|Logotipo 3D para evento|Painel iluminado para evento|Estrutura para evento|Cenografia|Comunicação visual para eventos',
    questions: [
      'Qual o tipo e a data do evento?',
      'Qual o local?',
      'Quais medidas e quantidades?',
      'Pode enviar a identidade visual ou referência?',
    ],
    related: ['Painel para fotos', 'Balcão promocional'],
  },
  {
    category: 'Estruturas e projetos especiais',
    description: 'Estruturas, bases, coberturas e peças produzidas sob medida.',
    services:
      'Estrutura metálica|Estrutura para fachada|Estrutura para painel|Base para totem|Pórtico especial|Marquise especial|Cobertura|Brise|Painel especial|Peça em ACM|Peça em acrílico|Projeto especial personalizado|Peça sob medida',
    questions: [
      'Qual é a aplicação da estrutura?',
      'Onde será instalada?',
      'Possui medidas, desenho ou foto do local?',
      'Há alguma condição especial no projeto?',
    ],
    related: ['Fachada com estrutura metálica', 'Totem metálico'],
  },
  {
    category: 'Comunicação digital',
    description:
      'Conteúdo e sinalização exibidos em TVs, telas e painéis digitais.',
    services:
      'TV corporativa|Digital signage|Mural digital|Menu board digital|Cardápio digital|Painel de ofertas digital|Painel informativo digital|TV para publicidade|TV para comunicação interna|Tela para recepção|Tela para loja|Tela para supermercado|Tela para clínica|Tela para restaurante|Tela para academia|Tela para hotel|Painel de LED indoor|Painel de LED outdoor|Videowall|Totem digital|Vision Central',
    questions: [
      'Quantas TVs ou telas serão utilizadas?',
      'Elas ficam em um local ou em vários?',
      'Que tipo de conteúdo pretende exibir?',
      'Precisa atualizar os conteúdos remotamente?',
    ],
    related: ['Vision Central', 'Totem digital'],
  },
  {
    category: 'Projeto e criação',
    description: 'Criação, preparação e aplicação de projetos visuais.',
    services:
      'Criação de layout|Desenvolvimento de fachada|Layout de letreiro|Projeto de comunicação visual|Vetorização|Preparação de arte|Aplicação de identidade visual|Mockup|Projeto visual|Projeto 3D|Desenvolvimento de sinalização|Projeto personalizado',
    questions: [
      'Qual peça ou projeto precisa criar?',
      'Já possui logotipo ou identidade visual?',
      'Pode enviar referências?',
      'Qual será a aplicação final?',
    ],
    related: ['Fachada comercial', 'Letreiro comercial'],
  },
  {
    category: 'Instalação e manutenção',
    description:
      'Instalação, reparo, substituição e revitalização de comunicação visual.',
    services:
      'Instalação de fachadas|Instalação de placas|Instalação de letras caixa|Instalação de letreiros|Instalação de totens|Instalação de adesivos|Instalação de estruturas|Instalação de comunicação interna|Instalação de TVs ou telas|Manutenção de fachadas|Manutenção de letreiros|Substituição de LED|Substituição de fontes|Reparo de comunicação visual|Revitalização|Remoção de comunicação visual antiga',
    questions: [
      'Qual item precisa instalar ou reparar?',
      'Onde ele está instalado?',
      'Pode enviar fotos e medidas?',
      'Qual problema está acontecendo?',
    ],
    related: ['Revitalização de fachada', 'Letreiro luminoso'],
  },
];

const naturalLanguage: Record<
  string,
  { synonyms?: string[]; phrases?: string[] }
> = {
  'letra caixa': {
    synonyms: ['letra 3D', 'letra em relevo'],
    phrases: ['letra saltada', 'letra alta', 'letra que fica pra fora'],
  },
  'letra caixa iluminada': {
    synonyms: ['letra com LED', 'nome iluminado'],
    phrases: ['nome da loja aceso', 'letras com luz'],
  },
  'logotipo iluminado': {
    synonyms: ['logo acesa', 'logo com luz'],
    phrases: ['quero minha logo acesa'],
  },
  'iluminação traseira': {
    synonyms: ['backlight', 'efeito halo'],
    phrases: ['luz atrás da letra'],
  },
  'fachada em ACM': {
    synonyms: ['frente em ACM', 'revestimento em ACM'],
    phrases: [
      'fechar a frente da loja com placas',
      'placa de alumínio da fachada',
      'modernizar a frente da loja',
    ],
  },
  'plotagem de veículo': {
    synonyms: ['adesivação de veículo', 'envelopamento'],
    phrases: [
      'plotar carro',
      'colocar propaganda no carro',
      'colocar minha marca no carro',
    ],
  },
  'adesivação de vitrine': {
    synonyms: ['adesivar loja', 'envelopar vitrine'],
    phrases: ['colocar adesivo no vidro da loja'],
  },
  'adesivo jateado': {
    synonyms: ['película fosca', 'vidro fosco'],
    phrases: ['quero deixar o vidro fosco'],
  },
  'adesivo perfurado': {
    synonyms: ['adesivo para visão de dentro'],
    phrases: ['adesivo que dá pra ver de dentro'],
  },
  'totem externo': {
    synonyms: ['placa vertical', 'totem de entrada'],
    phrases: ['placa que fica em pé na frente da loja'],
  },
  'painel para fotos': {
    synonyms: ['backdrop', 'painel instagramável'],
    phrases: ['painel para tirar foto'],
  },
  'vision central': {
    synonyms: ['gerenciador de TVs', 'gestão de telas', 'digital signage'],
    phrases: [
      'trocar propaganda das TVs pelo computador',
      'colocar promoções passando na TV',
      'gerenciar várias telas remotamente',
    ],
  },
};

const legacyIds: Record<string, string> = {
  'Fachada em ACM': 'acm',
  'Letra caixa': 'letras',
  'Iluminação frontal': 'luz',
  Banner: 'banner',
  Faixa: 'faixa',
  'Placa comercial': 'placa',
  'Sinalização interna': 'sinal',
  'Adesivo para vitrine': 'vitrine',
  'Adesivo para parede': 'parede',
  'Adesivação de carro': 'veiculo',
  'Adesivo para piso': 'piso',
};
const legacyNames: Record<string, string> = {
  acm: 'Fachadas em ACM',
  letras: 'Letras-caixa',
  luz: 'Identificação com iluminação',
  banner: 'Banners',
  faixa: 'Faixas',
  placa: 'Placas',
  vitrine: 'Adesivos para vitrines',
  parede: 'Adesivos para paredes',
  veiculo: 'Adesivos para veículos',
  piso: 'Adesivos para pisos',
};

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const knowledgeCatalogue: CatalogueDefinition[] = seeds.flatMap(
  (group) =>
    group.services.split('|').map((name, index) => {
      const natural =
        naturalLanguage[name.toLocaleLowerCase()] || naturalLanguage[name];
      const id =
        legacyIds[name] || `${slug(group.category)}-${slug(name)}-${index + 1}`;
      return {
        id,
        name: legacyNames[id] || name,
        category: group.category,
        description: `${name}. ${group.description}`,
        synonyms: natural?.synonyms || [],
        popularTerms: natural?.phrases || [],
        clientPhrases: natural?.phrases || [],
        keywords: Array.from(new Set([name, ...(natural?.synonyms || [])])),
        variations: [],
        characteristics: [],
        environments: group.environments || [],
        qualificationQuestions: group.questions,
        relatedServices: group.related || [],
        aiInstructions:
          name === 'Vision Central'
            ? 'Explique de forma simples que o Vision Central gerencia conteúdos exibidos em TVs e telas. Evite detalhes técnicos desnecessários.'
            : 'Explique em linguagem simples e faça somente as perguntas necessárias para entender a aplicação.',
      };
    }),
);

export const knowledgeCategories = seeds.map(({ category, description }) => ({
  name: category,
  description,
}));
