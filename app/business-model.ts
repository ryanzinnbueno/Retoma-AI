import {
  initialConfig,
  initialLeads,
  normalize,
  type Config,
  type Lead,
} from './recovery-model';
import { knowledgeCatalogue } from './knowledge-catalogue';
export const availability = [
  'Precisa confirmar',
  'Disponível',
  'Não disponível',
] as const;
export type Availability = (typeof availability)[number];
export const productStates = [
  'Não configurado',
  'Oferecemos',
  'Não oferecemos',
] as const;
export const catalogue: Array<readonly [string, string, string, string]> = [
  ...knowledgeCatalogue.map(
    (item) => [item.id, item.name, item.category, item.description] as const,
  ),
  [
    'cartao',
    'Cartões de visita',
    'Outros impressos',
    'Impressos para apresentação e contato.',
  ],
  ['panfleto', 'Panfletos', 'Outros impressos', 'Impressos para divulgação.'],
];
export type Product = {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  state: (typeof productStates)[number];
  materials: string[];
  structures?: string[];
  finishes: string[];
  applications: string[];
  variations?: string[];
  characteristics?: string[];
  environments?: string[];
  synonyms?: string[];
  popularTerms?: string[];
  clientPhrases?: string[];
  keywords?: string[];
  qualificationQuestions?: string[];
  relatedServices?: string[];
  aiInstructions?: string;
  art: Availability | 'Padrão da empresa';
  installation: Availability | 'Padrão da empresa';
  delivery: Availability | 'Padrão da empresa';
  pickup: Availability | 'Padrão da empresa';
  restrictions: string;
};
export type Business = {
  categories?: string[];
  disabledCategories?: string[];
  timezone: string;
  humanContact: string;
  humanDays: string;
  humanStart: string;
  humanEnd: string;
  art: Availability;
  installation: Availability;
  delivery: Availability;
  pickup: Availability;
  payments: string[];
  products: Product[];
  autoStart: string;
  autoEnd: string;
  autoDays: string[];
  paused: boolean;
  extraHandoff: string[];
};
export const serviceLabels = {
  art: 'Criação / ajuste de arte',
  installation: 'Instalação',
  delivery: 'Entrega',
  pickup: 'Retirada',
};
export function defaults(): Business {
  return {
    timezone: 'America/Bahia',
    humanContact: '',
    humanDays: 'Segunda a sexta',
    humanStart: '',
    humanEnd: '',
    art: 'Precisa confirmar',
    installation: 'Precisa confirmar',
    delivery: 'Precisa confirmar',
    pickup: 'Precisa confirmar',
    payments: [],
    disabledCategories: [],
    categories: [],
    products: catalogue.map(([id]) => {
      const definition = knowledgeCatalogue.find((item) => item.id === id);
      return {
        id,
        state: 'Não configurado',
        materials: [],
        structures: [],
        finishes: [],
        applications: [],
        variations: definition?.variations || [],
        characteristics: definition?.characteristics || [],
        environments: definition?.environments || [],
        synonyms: definition?.synonyms || [],
        popularTerms: definition?.popularTerms || [],
        clientPhrases: definition?.clientPhrases || [],
        keywords: definition?.keywords || [],
        qualificationQuestions: definition?.qualificationQuestions || [],
        relatedServices: definition?.relatedServices || [],
        aiInstructions: definition?.aiInstructions || '',
        art: 'Padrão da empresa',
        installation: 'Padrão da empresa',
        delivery: 'Padrão da empresa',
        pickup: 'Padrão da empresa',
        restrictions: '',
      };
    }),
    autoStart: '09:00',
    autoEnd: '17:00',
    autoDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    paused: false,
    extraHandoff: [],
  };
}
export function business(config: Config): Business {
  const base = defaults();
  if (!config.business) return base;
  const saved = config.business;
  const known = base.products.map((product) => {
    const current = saved.products?.find((item) => item.id === product.id);
    return current ? { ...product, ...current } : product;
  });
  const custom = (saved.products || []).filter(
    (product) => !known.some((item) => item.id === product.id),
  );
  return {
    ...base,
    ...saved,
    categories: Array.from(
      new Set([...(base.categories || []), ...(saved.categories || [])]),
    ),
    disabledCategories: saved.disabledCategories || [],
    products: [...known, ...custom],
  };
}
export function allCatalogue(
  config: Config,
): Array<readonly [string, string, string, string]> {
  return business(config).products.map((p) => {
    const base = catalogue.find((c) => c[0] === p.id);
    return [
      p.id,
      p.name || base?.[1] || 'Serviço',
      p.category || base?.[2] || 'Outros serviços',
      p.description ?? base?.[3] ?? '',
    ];
  });
}
export function categories(config: Config) {
  return [
    ...new Set([
      ...allCatalogue(config).map((c) => c[2]),
      ...(business(config).categories || []),
    ]),
  ];
}
export function categoryActive(config: Config, category: string) {
  return !config.business?.disabledCategories?.includes(category);
}
export function guided(config: Config): Config {
  const b = business(config);
  return {
    ...config,
    business: b,
    offer: b.products
      .filter(
        (p) =>
          p.state === 'Oferecemos' &&
          categoryActive(
            config,
            allCatalogue(config).find((c) => c[0] === p.id)?.[2] || '',
          ),
      )
      .map((p) => allCatalogue(config).find((c) => c[0] === p.id)?.[1])
      .join('\n'),
    excluded: b.products
      .filter((p) => p.state === 'Não oferecemos')
      .map((p) => allCatalogue(config).find((c) => c[0] === p.id)?.[1])
      .join('\n'),
    objective:
      'Recuperar conversas autorizadas, esclarecer dúvidas e envolver o vendedor.',
    limits: 'Não inventar informações nem prometer condições sem confirmação.',
    handoff: b.extraHandoff.join(', '),
    knowledge: [],
    priceHandoff: false,
    hours:
      b.humanStart && b.humanEnd
        ? b.humanDays + ' · ' + b.humanStart + '–' + b.humanEnd
        : 'Não informado',
  };
}
export type Workspace = { config: Config; leads: Lead[] };
export function seed(): Workspace {
  const b = defaults();
  // Only unambiguous selections from the original fictitious company are carried over.
  for (const p of b.products) {
    if (['acm', 'letras', 'luz'].includes(p.id)) p.state = 'Oferecemos';
    if (['cartao', 'panfleto'].includes(p.id)) p.state = 'Não oferecemos';
  }
  return {
    config: guided({ ...initialConfig, business: b }),
    leads: initialLeads.map((l, i) => ({
      ...l,
      reference: String(1041 + l.id),
      valueConfirmed: l.status === 'Vendido',
      productId: null,
      recoveryPaused: false,
      messages: l.messages.map((m, j) => ({
        ...m,
        id: 'seed-' + i + '-' + j,
        delivery: 'demo' as const,
      })),
    })),
  };
}
export function relevantProducts(
  config: Config,
  question: string,
  lead?: Lead,
) {
  const b = business(config),
    entries = allCatalogue(config),
    ignored = new Set([
      'para',
      'como',
      'com',
      'sem',
      'uma',
      'umas',
      'uns',
      'por',
      'sobre',
      'quero',
      'querendo',
      'preciso',
      'fazer',
      'loja',
      'projeto',
      'servico',
      'produto',
      'minha',
      'meu',
      'algo',
    ]);
  const tokens = (value: string) =>
    normalize(value)
      .split(' ')
      .map((word) =>
        word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word,
      )
      .filter((word) => word.length >= 3 && !ignored.has(word));
  const distance = (a: string, b: string) => {
    if (Math.abs(a.length - b.length) > 1) return 2;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const old = row[j];
        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          previous + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        previous = old;
      }
    }
    return row[b.length];
  };
  const find = (value: string) => {
    const normalized = normalize(value),
      wanted = tokens(value);
    const ranked = b.products
      .map((product) => {
        const entry = entries.find((item) => item[0] === product.id),
          fields = [
            entry?.[1] || '',
            ...(product.synonyms || []),
            ...(product.popularTerms || []),
            ...(product.clientPhrases || []),
            ...(product.keywords || []),
            ...(product.variations || []),
            ...(product.applications || []),
          ],
          phrases = fields.map(normalize).filter(Boolean),
          words = Array.from(new Set(fields.flatMap(tokens)));
        let score = phrases.reduce(
          (best, phrase) =>
            Math.max(
              best,
              phrase.length >= 5 &&
                (normalized.includes(phrase) || phrase.includes(normalized))
                ? 12 + Math.min(phrase.split(' ').length, 5)
                : 0,
            ),
          0,
        );
        for (const word of wanted) {
          if (words.includes(word)) score += 3;
          else if (
            word.length >= 5 &&
            words.some((candidate) => distance(word, candidate) <= 1)
          )
            score += 1;
        }
        return { product, score };
      })
      .filter((item) => item.score >= 3)
      .sort((a, b) => b.score - a.score);
    const threshold = Math.max(3, (ranked[0]?.score || 3) - 2);
    return ranked
      .filter((item) => item.score >= threshold)
      .map((item) => item.product);
  };
  let matched = find(question);
  if (!matched.length && lead?.productId)
    matched = b.products.filter((product) => product.id === lead.productId);
  if (!matched.length && lead?.service) matched = find(lead.service);
  return matched.slice(0, 5).map((p) => {
    const entry = entries.find((item) => item[0] === p.id);
    return {
      ...p,
      name: entry?.[1],
      category: entry?.[2],
      categoryActive: categoryActive(config, entry?.[2] || ''),
      services: Object.fromEntries(
        Object.keys(serviceLabels).map((k) => [
          k,
          p[k as keyof Product] === 'Padrão da empresa'
            ? b[k as keyof Business]
            : p[k as keyof Product],
        ]),
      ),
    };
  });
}
export function validateWorkspace(value: unknown): value is Workspace {
  const x = value as Workspace;
  if (!x || !x.config || !Array.isArray(x.leads) || x.leads.length > 100)
    return false;
  const c = x.config,
    b = c.business;
  if (
    !b ||
    !Array.isArray(b.products) ||
    b.products.length < catalogue.length ||
    b.products.length > 400 ||
    new Set(b.products.map((p) => p.id)).size !== b.products.length ||
    catalogue.some((c) => !b.products.some((p) => p.id === c[0]))
  )
    return false;
  if (
    b.disabledCategories !== undefined &&
    (!Array.isArray(b.disabledCategories) ||
      b.disabledCategories.length > 30 ||
      b.disabledCategories.some(
        (category) =>
          typeof category !== 'string' || !categories(c).includes(category),
      ))
  )
    return false;
  if (
    b.categories !== undefined &&
    (!Array.isArray(b.categories) ||
      b.categories.length > 30 ||
      b.categories.some(
        (c) => typeof c !== 'string' || !c.trim() || c.length > 80,
      ) ||
      new Set(b.categories.map(normalize)).size !== b.categories.length)
  )
    return false;
  if (
    b.products.some(
      (p) =>
        typeof p.id !== 'string' ||
        p.id.length > 180 ||
        (!catalogue.some((a) => a[0] === p.id) &&
          (!p.id.startsWith('custom-') ||
            !p.name?.trim() ||
            !p.category?.trim())) ||
        ['name', 'category', 'description'].some(
          (k) =>
            p[k as keyof Product] !== undefined &&
            (typeof p[k as keyof Product] !== 'string' ||
              String(p[k as keyof Product]).length >
                (k === 'description' ? 1000 : 100)),
        ) ||
        !productStates.includes(p.state) ||
        ![
          'materials',
          'finishes',
          'applications',
          'structures',
          'variations',
          'characteristics',
          'environments',
          'synonyms',
          'popularTerms',
          'clientPhrases',
          'keywords',
          'qualificationQuestions',
          'relatedServices',
        ].every(
          (k) =>
            p[k as keyof Product] === undefined ||
            (Array.isArray(p[k as keyof Product]) &&
              (p[k as keyof Product] as string[]).length <= 40 &&
              (p[k as keyof Product] as string[]).every(
                (v) => typeof v === 'string' && v.length <= 300,
              )),
        ) ||
        (p.aiInstructions !== undefined &&
          (typeof p.aiInstructions !== 'string' ||
            p.aiInstructions.length > 2000)) ||
        typeof p.restrictions !== 'string' ||
        p.restrictions.length > 1000 ||
        !Object.keys(serviceLabels).every((k) =>
          [...availability, 'Padrão da empresa'].includes(
            p[k as keyof Product] as any,
          ),
        ),
    )
  )
    return false;
  if (
    !Object.keys(serviceLabels).every((k) =>
      availability.includes(b[k as keyof Business] as any),
    ) ||
    !Array.isArray(b.payments) ||
    !Array.isArray(b.autoDays) ||
    !Array.isArray(b.extraHandoff) ||
    typeof b.paused !== 'boolean'
  )
    return false;
  if (
    !['company', 'assistant', 'region', 'tone'].every(
      (k) =>
        typeof c[k as keyof Config] === 'string' &&
        String(c[k as keyof Config]).length <= 300,
    ) ||
    ![
      'humanContact',
      'humanDays',
      'humanStart',
      'humanEnd',
      'autoStart',
      'autoEnd',
      'timezone',
    ].every(
      (k) =>
        typeof b[k as keyof Business] === 'string' &&
        String(b[k as keyof Business]).length <= 300,
    )
  )
    return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: b.timezone });
  } catch {
    return false;
  }
  if (
    !Array.isArray(c.days) ||
    c.days.length < 1 ||
    c.days.length > 5 ||
    c.days.some(
      (d, i) =>
        !Number.isInteger(d) ||
        d < 1 ||
        d > 90 ||
        (i > 0 && d <= c.days[i - 1]),
    )
  )
    return false;
  return (
    new Set(x.leads.map((l) => l.id)).size === x.leads.length &&
    x.leads.every(
      (l) =>
        Number.isSafeInteger(l.id) &&
        l.id > 0 &&
        typeof l.name === 'string' &&
        !!l.name.trim() &&
        l.name.length <= 200 &&
        (l.nameEdited === undefined || typeof l.nameEdited === 'boolean') &&
        (l.city === undefined ||
          (typeof l.city === 'string' && l.city.length <= 120)) &&
        (l.avatar === undefined ||
          (typeof l.avatar === 'string' &&
            l.avatar.length <= 20000 &&
            /^data:image\/(?:jpeg|png|webp);base64,/.test(l.avatar))) &&
        typeof l.service === 'string' &&
        l.service.length <= 300 &&
        typeof l.notes === 'string' &&
        l.notes.length <= 6000 &&
        ['Parado', 'Conversando', 'Vendido', 'Encerrado'].includes(l.status) &&
        (l.value === null ||
          (typeof l.value === 'number' &&
            Number.isFinite(l.value) &&
            l.value >= 0)) &&
        typeof l.ai === 'boolean' &&
        typeof l.consent === 'boolean' &&
        typeof l.optOut === 'boolean' &&
        Array.isArray(l.messages) &&
        l.messages.length <= 200 &&
        l.messages.every(
          (m) =>
            ['cliente', 'vendedor', 'ia'].includes(m.role) &&
            typeof m.text === 'string' &&
            m.text.length <= 6000,
        ) &&
        Array.isArray(l.history) &&
        l.history.length <= 300,
    )
  );
}
