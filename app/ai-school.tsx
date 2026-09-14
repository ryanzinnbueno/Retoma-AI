'use client';
import { useEffect, useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  MessageSquareText,
  Headphones,
  Pause,
  Check,
  ArrowRight,
  Settings2,
  Search,
  BookOpen,
  Plug,
  Save,
  Plus,
  FolderPlus,
  Layers,
  Clock3,
  MousePointerClick,
  MessageCircle,
  Building2,
  Download,
  Copy,
  Link2,
  Unplug,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  business,
  catalogue,
  allCatalogue,
  categories,
  categoryActive,
  availability,
  productStates,
  serviceLabels,
  type Business,
  type Product,
} from './business-model';
import type { Config } from './recovery-model';
const zones = [
  'America/Bahia',
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Cuiaba',
  'America/Recife',
  'America/Fortaleza',
  'America/Belem',
  'America/Rio_Branco',
];
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <NativeSelectOption key={o} value={o}>
            {o}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
function Checks({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="guided-checks">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o}>
          <Checkbox
            checked={value.includes(o)}
            onCheckedChange={(v) =>
              onChange(v ? [...value, o] : value.filter((x) => x !== o))
            }
          />
          {o}
        </label>
      ))}
    </fieldset>
  );
}
function ListField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  options: readonly string[];
}) {
  const [customOption, setCustomOption] = useState('');
  const normalize = (item: string) => item.trim().toLocaleLowerCase('pt-BR');
  const choices = [...value, ...options]
    .filter(
      (item, index, all) =>
        item.trim() &&
        all.findIndex(
          (candidate) => normalize(candidate) === normalize(item),
        ) === index,
    )
    .slice(0, 40);
  const selected = (option: string) =>
    value.some((item) => normalize(item) === normalize(option));
  const toggle = (option: string, checked: boolean) => {
    if (checked && !selected(option)) onChange([...value, option].slice(0, 40));
    if (!checked)
      onChange(value.filter((item) => normalize(item) !== normalize(option)));
  };
  const addCustomOption = () => {
    const next = customOption.trim();
    if (!next || selected(next) || value.length >= 40) return;
    onChange([...value, next]);
    setCustomOption('');
  };
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="choice-options">
        {choices.map((option) => (
          <label key={option}>
            <Checkbox
              checked={selected(option)}
              onCheckedChange={(checked) => toggle(option, checked === true)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <details className="choice-custom">
        <summary>Não encontrou? Adicionar outra opção</summary>
        <div>
          <input
            value={customOption}
            maxLength={120}
            placeholder={placeholder}
            onChange={(event) => setCustomOption(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomOption();
              }
            }}
          />
          <button type="button" className="btn" onClick={addCustomOption}>
            Adicionar
          </button>
        </div>
      </details>
      <small>Marque somente as opções confirmadas pela empresa.</small>
    </fieldset>
  );
}
const productChoiceOptions = {
  materials: [
    'ACM',
    'Acrílico',
    'Alumínio',
    'Aço galvanizado',
    'Aço inox',
    'Chapa metálica',
    'Lona',
    'Vinil adesivo',
    'PVC',
    'PVC expandido',
    'PS',
    'MDF',
    'Madeira',
    'Policarbonato',
    'LED',
  ],
  variations: [
    'Iluminado',
    'Sem iluminação',
    'Frontal',
    'Backlight',
    'Efeito halo',
    'Dupla face',
    'Uso interno',
    'Uso externo',
    'Total',
    'Parcial',
    'Impresso',
    'Recorte',
    'Transparente',
    'Perfurado',
    'Jateado',
    'Refletivo',
  ],
  characteristics: [
    'Produção sob medida',
    'Resistente ao uso externo',
    'Estrutura personalizada',
    'Iluminação em LED',
    'Aplicação removível',
    'Limpeza facilitada',
    'Alta visibilidade',
    'Uso promocional',
    'Uso institucional',
  ],
  environments: [
    'Fachada externa',
    'Entrada de loja',
    'Recepção',
    'Ambiente interno',
    'Ambiente externo',
    'Vitrine',
    'Vidro',
    'Parede',
    'Piso',
    'Veículo',
    'Evento',
    'Ponto de venda',
    'Escritório',
    'Clínica',
    'Restaurante',
    'Hotel',
    'Academia',
    'Escola',
    'Condomínio',
    'Indústria',
  ],
  structures: [
    'Metalon galvanizado',
    'Estrutura de alumínio',
    'Estrutura metálica',
    'Base metálica',
    'Fixação em parede',
    'Fixação suspensa',
    'Estrutura autoportante',
    'Sem estrutura',
  ],
  finishes: [
    'Recorte',
    'Dobra',
    'Pintura',
    'Laminação',
    'Polimento',
    'Escovado',
    'Brilhante',
    'Fosco',
    'Adesivado',
    'Iluminado',
    'Gravação',
    'Impressão',
  ],
  applications: [
    'Identificação de fachada',
    'Revestimento',
    'Sinalização',
    'Decoração',
    'Publicidade',
    'Privacidade em vidro',
    'Identificação de frota',
    'Campanha promocional',
    'Comunicação interna',
    'Ponto de venda',
  ],
  qualificationQuestions: [
    'Onde será instalado?',
    'O uso é interno ou externo?',
    'Qual é o tamanho aproximado?',
    'Qual é a quantidade?',
    'Deseja iluminação?',
    'Já possui arte ou logotipo?',
    'Pode enviar uma foto do local?',
    'Pode enviar uma referência visual?',
    'Precisa de instalação?',
    'Qual é a data necessária?',
  ],
} as const;
const mandatory = [
  'Não inventar informações.',
  'Não prometer condições sem confirmação.',
  'Respeitar pedidos de interrupção de contato.',
  'Encaminhar pedidos de atendimento humano.',
  'Pausar a IA quando o vendedor assumir.',
];
export function School({
  config,
  onSave,
  onConfigure,
}: {
  config: Config;
  onSave: (c: Config) => void;
  onConfigure: () => void;
}) {
  const [tab, setTab] = useState('how'),
    [draft, setDraft] = useState(config);
  const b = business(draft),
    patch = (p: Partial<Business>) =>
      setDraft((d) => ({ ...d, business: { ...business(d), ...p } }));
  return (
    <div className="content-page">
      <div className="page-title">
        <div>
          <div className="eyebrow">ASSISTENTE RETOMA</div>
          <h1>Seu assistente de vendas</h1>
          <p>
            Configure fatos e preferências, sem escrever prompts ou treinar a
            IA.
          </p>
        </div>
        <span className="pill green">
          <Sparkles size={15} />
          Assistente virtual
        </span>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="section-tabs">
          <TabsTrigger value="how">
            <BookOpen size={17} />
            Como funciona
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings2 size={17} />
            Regras de atendimento
          </TabsTrigger>
        </TabsList>
        <TabsContent value="how">
          <div className="integration-notice">
            <Plug size={22} />
            <div>
              <b>WhatsApp Web conectado pela extensão</b>
              <p>
                Instale uma vez em Configurações → WhatsApp. Com o
                acompanhamento automático ligado, novas conversas iniciadas pelo
                cliente entram na Central, recebem respostas da IA e chamam o
                vendedor quando necessário.
              </p>
            </div>
          </div>
          <div className="tutorial-flow">
            {[
              [
                '1',
                'Selecione a conversa',
                'Abra um acompanhamento existente ou adicione contato e assunto. Orçamento e valor são opcionais.',
              ],
              [
                '2',
                'Ative o acompanhamento',
                'Revise contexto e autorização. Só a conversa selecionada será habilitada.',
              ],
              [
                '3',
                'Retome o contato',
                'Use “Simular próxima retomada”. Os intervalos são preferências salvas, não envios agendados.',
              ],
              [
                '4',
                'Trate a resposta',
                'Digite uma mensagem fictícia. A IA usa os fatos salvos e o histórico; a sequência de silêncio é suspensa.',
              ],
              [
                '5',
                'Assuma quando necessário',
                'O pedido de ajuda aparece no Retoma, com motivo e resumo. Não há notificação externa. A IA responde outras dúvidas enquanto você não assume. Assumir pausa a IA.',
              ],
              [
                '6',
                'Pause ou encerre',
                'Pausar retomadas não desliga respostas. Pausar IA devolve o atendimento ao vendedor. Vendido, encerrado ou recusa bloqueiam retomadas.',
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="number-disc">
                  {Number(n) === 1 ? (
                    <MessageSquareText size={20} />
                  ) : Number(n) === 2 ? (
                    <MousePointerClick size={20} />
                  ) : Number(n) === 3 ? (
                    <Clock3 size={20} />
                  ) : Number(n) === 4 ? (
                    <MessageCircle size={20} />
                  ) : Number(n) === 5 ? (
                    <Headphones size={20} />
                  ) : (
                    <Pause size={20} />
                  )}
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <section className="surface settings-section">
            <h2>O que orienta as respostas</h2>
            <div className="education-grid">
              <article>
                <BookOpen />
                <h3>Método do Retoma</h3>
                <p>
                  A assistente responde com as informações confirmadas e pede
                  ajuda quando faltar uma resposta segura.
                </p>
              </article>
              <article>
                <Settings2 />
                <h3>Fatos da sua empresa</h3>
                <p>
                  Produtos oferecidos, serviços e condições confirmadas. Ativar
                  um produto não inicia contatos.
                </p>
              </article>
              <article>
                <MessageSquareText />
                <h3>Contexto da conversa</h3>
                <p>
                  Histórico e informações específicas. Um valor antigo não
                  comprova preço vigente.
                </p>
              </article>
            </div>
            <button className="btn outline" onClick={onConfigure}>
              Configurar minha empresa <ArrowRight size={16} />
            </button>
          </section>
        </TabsContent>
        <TabsContent value="rules">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave(draft);
            }}
          >
            <div className="settings-layout">
              <section className="surface settings-section">
                <h2>Retomadas automáticas</h2>
                <p>
                  Preferências preparadas para a conexão futura. Atualmente o
                  tempo é avançado manualmente nos testes.
                </p>
                <div className="toggle-row">
                  <div>
                    <b>Pausa geral da automação</b>
                    <p>
                      Bloqueia retomadas e respostas automáticas em todas as
                      conversas. O vendedor continua podendo atender.
                    </p>
                  </div>
                  <Switch
                    checked={b.paused}
                    onCheckedChange={(v) => patch({ paused: v })}
                    aria-label="Pausa geral"
                  />
                </div>
                <div className="two-fields">
                  <label className="field">
                    Início
                    <input
                      type="time"
                      required
                      value={b.autoStart}
                      onChange={(e) => patch({ autoStart: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    Fim
                    <input
                      type="time"
                      required
                      value={b.autoEnd}
                      onChange={(e) => patch({ autoEnd: e.target.value })}
                    />
                  </label>
                </div>
                <p>
                  Fuso da empresa: {b.timezone}. Altere em Dados da empresa.
                </p>
                <Checks
                  label="Dias de retomada"
                  options={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']}
                  value={b.autoDays}
                  onChange={(autoDays) => patch({ autoDays })}
                />
                <label className="field">
                  Limite de tentativas
                  <NativeSelect
                    value={String(draft.days.length)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        days: Array.from(
                          { length: Number(e.target.value) },
                          (_, i) =>
                            d.days[i] ??
                            (d.days.at(-1) || 0) + (i - d.days.length + 1) * 3,
                        ),
                      }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <NativeSelectOption key={n} value={String(n)}>
                        {n}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
                <div className="interval-grid">
                  {draft.days.map((d, i) => (
                    <label className="field" key={i}>
                      {i + 1}ª tentativa
                      <input
                        type="number"
                        min={i ? draft.days[i - 1] + 1 : 1}
                        max={90}
                        required
                        value={d}
                        onChange={(e) =>
                          setDraft((c) => ({
                            ...c,
                            days: c.days.map((v, j) =>
                              j === i ? Number(e.target.value) : v,
                            ),
                          }))
                        }
                      />
                      <small>Dias após início do acompanhamento</small>
                    </label>
                  ))}
                </div>
              </section>
              <section className="surface settings-section">
                <h2>Atendimento e encaminhamentos</h2>
                <SelectField
                  label="Tom da conversa"
                  value={draft.tone}
                  options={['Cordial e consultivo', 'Direto e objetivo']}
                  onChange={(tone) => setDraft((d) => ({ ...d, tone }))}
                />
                <div className="inline-tip">
                  <Headphones size={20} />
                  <span>
                    Responsável: {b.humanContact || 'Não informado'}.{' '}
                    <button
                      type="button"
                      className="text-link"
                      onClick={onConfigure}
                    >
                      Configurar nos dados da empresa
                    </button>
                  </span>
                </div>
                <Checks
                  label="Situações adicionais para chamar o vendedor"
                  options={[
                    'Alteração de projeto',
                    'Prazo urgente',
                    'Negociação de preço',
                    'Visita técnica',
                    'Pedido fora da região',
                  ]}
                  value={b.extraHandoff}
                  onChange={(extraHandoff) => patch({ extraHandoff })}
                />
                <h3>Regras obrigatórias</h3>
                {mandatory.map((r) => (
                  <div className="fixed-rule" key={r}>
                    <ShieldCheck size={17} />
                    <span>{r}</span>
                  </div>
                ))}
                <p>
                  O horário humano é informativo e não garante resposta
                  imediata. As preferências de retomada não criam agenda real
                  nesta etapa.
                </p>
              </section>
            </div>
            <div className="settings-save">
              <span>Regras centrais não podem ser desativadas.</span>
              <button className="btn primary">
                <Save size={16} />
                Salvar preferências
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export function SettingsPage({
  config,
  onSave,
  onSchool,
}: {
  config: Config;
  onSave: (c: Config) => void;
  onSchool: () => void;
}) {
  const [tab, setTab] = useState('business'),
    [draft, setDraft] = useState(config);
  const b = business(draft);
  const patch = (p: Partial<Business>) =>
    setDraft((d) => ({ ...d, business: { ...business(d), ...p } }));
  return (
    <div className="content-page">
      <div className="page-title">
        <div>
          <div className="eyebrow">CONFIGURAÇÕES</div>
          <h1>Configurações da empresa</h1>
          <p>Preencha somente o que foi confirmado pela empresa.</p>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="section-tabs">
          <TabsTrigger value="business">
            <Building2 size={17} />
            Dados da empresa
          </TabsTrigger>
          <TabsTrigger value="products">
            <Layers size={17} />
            Base de conhecimento da IA
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <MessageCircle size={17} />
            WhatsApp
          </TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave({
                ...draft,
                business: {
                  ...b,
                  products: business(config).products,
                  categories: business(config).categories,
                },
              });
            }}
          >
            <div className="settings-layout">
              <section className="surface settings-section">
                <h2>Identidade e atendimento humano</h2>
                <div className="two-fields">
                  <label className="field">
                    Nome comercial
                    <input
                      value={draft.company}
                      required
                      maxLength={200}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, company: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Nome da assistente
                    <input
                      value={draft.assistant}
                      required
                      maxLength={80}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, assistant: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  Região atendida
                  <input
                    value={draft.region}
                    maxLength={300}
                    placeholder="Não informado"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, region: e.target.value }))
                    }
                  />
                </label>
                <SelectField
                  label="Dias de atendimento humano"
                  value={b.humanDays}
                  options={[
                    'Não informado',
                    'Segunda a sexta',
                    'Segunda a sábado',
                    'Todos os dias',
                    'Somente com agendamento',
                  ]}
                  onChange={(humanDays) => patch({ humanDays })}
                />
                <div className="two-fields">
                  <label className="field">
                    Abertura
                    <input
                      type="time"
                      value={b.humanStart}
                      onChange={(e) => patch({ humanStart: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    Encerramento
                    <input
                      type="time"
                      value={b.humanEnd}
                      onChange={(e) => patch({ humanEnd: e.target.value })}
                    />
                  </label>
                </div>
                <SelectField
                  label="Fuso horário"
                  value={b.timezone}
                  options={zones}
                  onChange={(timezone) => patch({ timezone })}
                />
                <label className="field">
                  Responsável ou canal humano
                  <input
                    value={b.humanContact}
                    maxLength={200}
                    placeholder="Ex.: Equipe comercial · ramal 2"
                    onChange={(e) => patch({ humanContact: e.target.value })}
                  />
                </label>
                <p>Referência interna. Não dispara notificações externas.</p>
              </section>
              <section className="surface settings-section">
                <h2>Serviços gerais</h2>
                {Object.entries(serviceLabels).map(([key, label]) => (
                  <SelectField
                    key={key}
                    label={label}
                    value={b[key as keyof Business] as string}
                    options={availability}
                    onChange={(v) => patch({ [key]: v })}
                  />
                ))}
                <div className="inline-tip">
                  <ShieldCheck />
                  <span>
                    Disponível não significa incluso no orçamento. Preço, prazo,
                    garantia e parcelamento precisam de confirmação específica.
                  </span>
                </div>
                <Checks
                  label="Formas de pagamento confirmadas (opcional)"
                  options={[
                    'Pix',
                    'Dinheiro',
                    'Cartão de crédito',
                    'Cartão de débito',
                    'Boleto',
                    'Transferência',
                  ]}
                  value={b.payments}
                  onChange={(payments) => patch({ payments })}
                />
              </section>
            </div>
            <div className="settings-save">
              <span>Campos vazios permanecem não informados.</span>
              <button className="btn primary">
                <Save size={16} />
                Salvar dados da empresa
              </button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="products">
          <ProductCatalogue config={config} onSave={onSave} />
        </TabsContent>
        <TabsContent value="integrations">
          <ExtensionConnection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
function ExtensionConnection() {
  const [token, setToken] = useState(''),
    [linked, setLinked] = useState<boolean | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const status = async () => {
    try {
      const r = await fetch('/api/extension/link');
      const data: any = await r.json();
      if (!r.ok) throw Error(data.error);
      setLinked(!!data.linked);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : 'Não foi possível verificar o vínculo.',
      );
    }
  };
  useEffect(() => {
    void status().finally(() => setLinked((v) => v ?? false));
  }, []);
  const create = async () => {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/extension/link', { method: 'POST' }),
        data: any = await r.json();
      if (!r.ok) throw Error(data.error);
      setToken(data.token);
      setLinked(true);
      try {
        await navigator.clipboard.writeText(data.token);
        setMessage(
          'Código criado e copiado. Abra a extensão, cole e clique em Conectar e testar.',
        );
      } catch {
        setMessage('Código criado. Copie abaixo e cole na extensão.');
      }
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'Não foi possível criar o vínculo.',
      );
    } finally {
      setBusy(false);
    }
  };
  const revoke = async () => {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/extension/link', { method: 'DELETE' }),
        data: any = await r.json();
      if (!r.ok) throw Error(data.error);
      setLinked(false);
      setToken('');
      setMessage('Acesso da extensão revogado.');
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'Não foi possível revogar o acesso.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="surface settings-section whatsapp-connect extension-connect">
      <img
        className="settings-brand-icon"
        src="/retoma-icon.png"
        alt="Símbolo Retoma"
      />
      <span className={'pill ' + (linked ? 'green' : 'amber')}>
        {linked ? 'Vínculo pronto' : 'Não vinculada'}
      </span>
      <h2>Conecte o WhatsApp Web ao Retoma</h2>
      <p>
        A extensão fica responsável apenas por ler e enviar no WhatsApp Web.
        Regras, histórico, IA, alertas e controle do vendedor ficam
        centralizados no Retoma.
      </p>
      <div className="connection-steps">
        <span>
          <Download size={20} />
          Instalar uma vez
        </span>
        <span>
          <Link2 size={20} />
          Colar um código
        </span>
        <span>
          <Sparkles size={20} />
          Atender automaticamente
        </span>
      </div>
      <div className="extension-actions">
        <a className="btn outline" href="/retoma-extension.zip" download>
          <Download size={17} />
          Baixar extensão 0.7.2
        </a>
        {linked ? (
          <button className="btn outline" onClick={revoke} disabled={busy}>
            <Unplug size={17} />
            Revogar acesso
          </button>
        ) : (
          <button className="btn primary" onClick={create} disabled={busy}>
            <Link2 size={17} />
            {busy ? 'Criando…' : 'Criar e copiar código'}
          </button>
        )}
      </div>
      {linked && !token && (
        <button className="btn primary" onClick={create} disabled={busy}>
          <Link2 size={17} />
          Gerar novo código seguro
        </button>
      )}
      {token && (
        <div className="extension-token">
          <label className="field">
            Código de vínculo
            <input readOnly value={token} />
          </label>
          <button
            className="btn primary"
            onClick={async () => {
              await navigator.clipboard.writeText(token);
              setMessage('Código copiado. Cole na extensão.');
            }}
          >
            <Copy size={17} />
            Copiar código
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="inline-tip">
          <ShieldCheck size={18} />
          <span>{message}</span>
        </p>
      )}
      <ol className="extension-install">
        <li>Baixe e extraia o arquivo em uma pasta permanente.</li>
        <li>
          Abra <b>chrome://extensions</b>, remova a versão antiga e clique em{' '}
          <b>Carregar sem compactação</b>.
        </li>
        <li>
          Selecione a pasta extraída, abra a extensão Retoma e cole um código
          novo.
        </li>
        <li>
          Em um perfil dedicado, marque a aba do WhatsApp Web como operadora e
          mantenha-a aberta.
        </li>
      </ol>
      <p>
        <b>Versão beta:</b> a versão 0.7 usa uma aba operadora dedicada, impede
        que mensagens enviadas pela própria IA iniciem novas respostas e desliga
        o envio paralelo da API oficial enquanto a extensão estiver vinculada.
      </p>
    </section>
  );
}
function ProductCatalogue({
  config,
  onSave,
}: {
  config: Config;
  onSave: (c: Config) => void;
}) {
  const b = business(config),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('Todas'),
    [state, setState] = useState('Todos'),
    [editing, setEditing] = useState<Product | null>(null),
    [categoryTarget, setCategoryTarget] = useState(''),
    [categoryName, setCategoryName] = useState('');
  const entries = allCatalogue(config);
  const [adding, setAdding] = useState<'service' | 'category' | null>(null),
    [formError, setFormError] = useState('');
  const filtered = entries.filter((c) => {
    const product = b.products.find((p) => p.id === c[0]);
    return (
      [
        c[1],
        ...(product?.synonyms || []),
        ...(product?.popularTerms || []),
        ...(product?.keywords || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === 'Todas' || c[2] === category) &&
      (state === 'Todos' || product?.state === state)
    );
  });
  const update = (p: Partial<Product>) =>
    setEditing((e) => (e ? { ...e, ...p } : e));
  return (
    <>
      <div className="catalogue-actions">
        <span>
          <Layers size={20} />
          {entries.length} produtos e serviços · {categories(config).length}{' '}
          categorias · base configurável da IA
        </span>
        <button
          className="btn outline"
          onClick={() => {
            setAdding('category');
            setCategoryTarget('');
            setCategoryName('');
            setFormError('');
          }}
        >
          <FolderPlus size={17} />
          Gerenciar categorias
        </button>
        <button
          className="btn primary"
          onClick={() => {
            setAdding('service');
            setFormError('');
          }}
        >
          <Plus size={17} />
          Adicionar serviço
        </button>
      </div>
      <div className="catalogue-filters">
        <label className="search-box">
          <Search size={18} />
          <input
            aria-label="Buscar produto"
            placeholder="Buscar produto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <SelectField
          label="Categoria"
          value={category}
          options={['Todas', ...categories(config)]}
          onChange={setCategory}
        />
        <SelectField
          label="Estado"
          value={state}
          options={['Todos', ...productStates]}
          onChange={setState}
        />
      </div>
      <p className="inline-tip">
        A lista é uma base de conhecimento do setor. A IA só pode oferecer
        serviços marcados como “Oferecemos” dentro de categorias ativas.
      </p>
      <div className="catalogue-grid">
        {filtered.map(([id, name, cat, description]) => {
          const p = b.products.find((p) => p.id === id)!;
          return (
            <article className="surface product-card" key={id}>
              <small>
                {cat} ·{' '}
                {categoryActive(config, cat)
                  ? 'categoria ativa'
                  : 'categoria inativa'}
              </small>
              <h3>{name}</h3>
              <p>{description}</p>
              <span
                className={
                  'pill ' +
                  (p.state === 'Oferecemos'
                    ? 'green'
                    : p.state === 'Não oferecemos'
                      ? 'neutral'
                      : 'amber')
                }
              >
                {p.state}
              </span>
              <p>
                <b>Confirmado:</b>{' '}
                {p.state === 'Oferecemos'
                  ? [
                      ...p.materials,
                      ...(p.structures || []),
                      ...p.finishes,
                      ...p.applications,
                    ].join(', ') ||
                    'Oferta confirmada; características não informadas.'
                  : p.state === 'Não oferecemos'
                    ? 'Não oferecido pela empresa.'
                    : 'Nenhuma oferta confirmada.'}
              </p>
              <p className="product-pending">
                <b>Pendências:</b>{' '}
                {p.state === 'Oferecemos'
                  ? 'Confirmar condições, inclusão, prazo e características não preenchidas.'
                  : p.state === 'Não configurado'
                    ? 'Confirmar se a empresa oferece.'
                    : 'Sem configuração de oferta.'}
              </p>
              <button
                className="btn outline full"
                onClick={() => setEditing(structuredClone(p))}
              >
                Configurar <Settings2 size={16} />
              </button>
            </article>
          );
        })}
      </div>
      {!filtered.length && <p>Nenhum produto encontrado.</p>}
      <Sheet
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <SheetContent className="product-sheet">
          {editing && (
            <>
              <SheetTitle>
                {entries.find((c) => c[0] === editing.id)?.[1]}
              </SheetTitle>
              <SheetDescription>
                Informe o que sua empresa realmente oferece. Você pode ajustar
                os serviços para este produto.
              </SheetDescription>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave({
                    ...config,
                    business: {
                      ...b,
                      products: b.products.map((p) =>
                        p.id === editing.id ? editing : p,
                      ),
                    },
                  });
                  setEditing(null);
                }}
              >
                <label className="field">
                  Nome do produto ou serviço
                  <input
                    required
                    maxLength={100}
                    value={
                      editing.name ??
                      entries.find((c) => c[0] === editing.id)?.[1] ??
                      ''
                    }
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
                <SelectField
                  label="Categoria"
                  value={
                    editing.category ??
                    entries.find((c) => c[0] === editing.id)?.[2] ??
                    ''
                  }
                  options={categories(config)}
                  onChange={(category) => update({ category })}
                />
                <label className="field">
                  O que a empresa oferece
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={
                      editing.description ??
                      entries.find((c) => c[0] === editing.id)?.[3] ??
                      ''
                    }
                    onChange={(e) => update({ description: e.target.value })}
                  />
                </label>
                <SelectField
                  label="Estado do produto"
                  value={editing.state}
                  options={productStates}
                  onChange={(state) =>
                    update({ state: state as Product['state'] })
                  }
                />
                <>
                  <details open>
                    <summary>Características confirmadas</summary>
                    <ListField
                      label="Materiais"
                      value={editing.materials}
                      onChange={(materials) => update({ materials })}
                      placeholder="Ex.: ACM 3 mm, lona 440 g, vinil adesivo"
                      options={productChoiceOptions.materials}
                    />
                    <ListField
                      label="Variações"
                      value={editing.variations || []}
                      onChange={(variations) => update({ variations })}
                      placeholder="Ex.: iluminado, sem iluminação, dupla face"
                      options={productChoiceOptions.variations}
                    />
                    <ListField
                      label="Características técnicas confirmadas"
                      value={editing.characteristics || []}
                      onChange={(characteristics) =>
                        update({ characteristics })
                      }
                      placeholder="Inclua somente características confirmadas pela empresa"
                      options={productChoiceOptions.characteristics}
                    />
                    <ListField
                      label="Ambientes indicados"
                      value={editing.environments || []}
                      onChange={(environments) => update({ environments })}
                      placeholder="Ex.: fachada externa, recepção, vitrine"
                      options={productChoiceOptions.environments}
                    />
                    <ListField
                      label="Estruturas"
                      value={editing.structures || []}
                      onChange={(structures) => update({ structures })}
                      placeholder="Ex.: metalon galvanizado, estrutura de alumínio"
                      options={productChoiceOptions.structures}
                    />
                    <ListField
                      label="Acabamentos"
                      value={editing.finishes}
                      onChange={(finishes) => update({ finishes })}
                      placeholder="Ex.: recorte, dobra, pintura, laminação"
                      options={productChoiceOptions.finishes}
                    />
                    <ListField
                      label="Aplicações atendidas"
                      value={editing.applications}
                      onChange={(applications) => update({ applications })}
                      placeholder="Ex.: fachada externa, recepção, vitrine"
                      options={productChoiceOptions.applications}
                    />
                    <p>
                      Opções são possibilidades para confirmação, não garantias
                      de desempenho.
                    </p>
                  </details>
                  <details open>
                    <summary>Como os clientes pedem este serviço</summary>
                    <ListField
                      label="Sinônimos"
                      value={editing.synonyms || []}
                      onChange={(synonyms) => update({ synonyms })}
                      placeholder="Ex.: letra 3D, letra em relevo"
                      options={editing.synonyms || []}
                    />
                    <ListField
                      label="Termos populares"
                      value={editing.popularTerms || []}
                      onChange={(popularTerms) => update({ popularTerms })}
                      placeholder="Ex.: letra saltada, placa que fica em pé"
                      options={editing.popularTerms || []}
                    />
                    <ListField
                      label="Formas de pedir"
                      value={editing.clientPhrases || []}
                      onChange={(clientPhrases) => update({ clientPhrases })}
                      placeholder="Ex.: quero minha logo com luz atrás"
                      options={editing.clientPhrases || []}
                    />
                    <ListField
                      label="Palavras-chave"
                      value={editing.keywords || []}
                      onChange={(keywords) => update({ keywords })}
                      placeholder="Ex.: fachada, ACM, revestimento"
                      options={[
                        editing.name || '',
                        editing.category || '',
                        ...(editing.keywords || []),
                      ]}
                    />
                  </details>
                  <details open>
                    <summary>Condução do atendimento</summary>
                    <ListField
                      label="Perguntas de qualificação"
                      value={editing.qualificationQuestions || []}
                      onChange={(qualificationQuestions) =>
                        update({ qualificationQuestions })
                      }
                      placeholder="Ex.: Onde será instalado? Qual o tamanho aproximado?"
                      options={productChoiceOptions.qualificationQuestions}
                    />
                    <ListField
                      label="Serviços relacionados"
                      value={editing.relatedServices || []}
                      onChange={(relatedServices) =>
                        update({ relatedServices })
                      }
                      placeholder="Ex.: letra caixa, adesivação de vitrine"
                      options={entries
                        .filter(
                          (entry) =>
                            entry[2] === editing.category &&
                            entry[0] !== editing.id,
                        )
                        .map((entry) => entry[1])
                        .slice(0, 24)}
                    />
                    <label className="field">
                      Instruções específicas para a IA
                      <textarea
                        maxLength={2000}
                        rows={4}
                        value={editing.aiInstructions || ''}
                        onChange={(event) =>
                          update({ aiInstructions: event.target.value })
                        }
                        placeholder="Como explicar, o que confirmar e o que não presumir."
                      />
                    </label>
                  </details>
                  <details open>
                    <summary>Serviços deste produto</summary>
                    {Object.entries(serviceLabels).map(([key, label]) => (
                      <div key={key}>
                        <SelectField
                          label={label}
                          value={editing[key as keyof Product] as string}
                          options={['Padrão da empresa', ...availability]}
                          onChange={(v) => update({ [key]: v })}
                        />
                        <small>
                          {editing[key as keyof Product] === 'Padrão da empresa'
                            ? 'Herdado: ' + b[key as keyof Business]
                            : 'Configuração deste produto.'}
                        </small>
                      </div>
                    ))}
                  </details>
                  <label className="field">
                    Restrições confirmadas
                    <textarea
                      maxLength={1000}
                      rows={3}
                      value={editing.restrictions}
                      onChange={(e) => update({ restrictions: e.target.value })}
                    />
                  </label>
                  <p>
                    Instalação disponível não significa instalação inclusa.
                    Nunca presumir preço, prazo, parcelamento ou garantia.
                  </p>
                </>
                <button className="btn primary full">
                  <Check size={16} />
                  Salvar configuração
                </button>
                {editing.id.startsWith('custom-') && (
                  <button
                    type="button"
                    className="btn outline full"
                    onClick={() => {
                      onSave({
                        ...config,
                        business: {
                          ...b,
                          products: b.products.filter(
                            (product) => product.id !== editing.id,
                          ),
                        },
                      });
                      setEditing(null);
                    }}
                  >
                    <Trash2 size={16} /> Remover este serviço
                  </button>
                )}
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!adding}
        onOpenChange={(v) => {
          if (!v) setAdding(null);
        }}
      >
        <DialogContent className="retoma-dialog">
          <DialogTitle>
            {adding === 'category'
              ? 'Gerenciar categorias'
              : 'Adicionar serviço da empresa'}
          </DialogTitle>
          <DialogDescription>
            Os dados salvos serão usados pela assistente. Adicionar não inicia
            contato com clientes.
          </DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                name = String(f.get('name') || '').trim();
              if (!name) return;
              if (adding === 'category') {
                if (
                  categories(config).some(
                    (c) =>
                      c !== categoryTarget &&
                      c.toLocaleLowerCase() === name.toLocaleLowerCase(),
                  )
                ) {
                  setFormError('Essa categoria já existe.');
                  return;
                }
                onSave({
                  ...config,
                  business: {
                    ...b,
                    categories: categoryTarget
                      ? (b.categories || [])
                          .filter((item) => item !== categoryTarget)
                          .concat(name)
                      : [...(b.categories || []), name],
                    disabledCategories: categoryTarget
                      ? (b.disabledCategories || []).map((item) =>
                          item === categoryTarget ? name : item,
                        )
                      : b.disabledCategories,
                    products: categoryTarget
                      ? b.products.map((product) => {
                          const current = allCatalogue(config).find(
                            (item) => item[0] === product.id,
                          )?.[2];
                          return current === categoryTarget
                            ? { ...product, category: name }
                            : product;
                        })
                      : b.products,
                  },
                });
              } else {
                if (
                  entries.some(
                    (c) =>
                      c[1].toLocaleLowerCase() === name.toLocaleLowerCase(),
                  )
                ) {
                  setFormError('Esse serviço já existe.');
                  return;
                }
                const p: Product = {
                  id: 'custom-' + crypto.randomUUID(),
                  name,
                  category: String(f.get('category')),
                  description: String(f.get('description') || '').trim(),
                  state: 'Oferecemos',
                  materials: [],
                  structures: [],
                  finishes: [],
                  applications: [],
                  variations: [],
                  characteristics: [],
                  environments: [],
                  synonyms: [],
                  popularTerms: [],
                  clientPhrases: [],
                  keywords: [],
                  qualificationQuestions: [],
                  relatedServices: [],
                  aiInstructions: '',
                  art: 'Padrão da empresa',
                  installation: 'Padrão da empresa',
                  delivery: 'Padrão da empresa',
                  pickup: 'Padrão da empresa',
                  restrictions: '',
                };
                onSave({
                  ...config,
                  business: { ...b, products: [...b.products, p] },
                });
              }
              setAdding(null);
            }}
          >
            {adding === 'category' && (
              <label className="field">
                Categoria que deseja alterar
                <NativeSelect
                  value={categoryTarget}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCategoryTarget(value);
                    setCategoryName(value);
                  }}
                >
                  <NativeSelectOption value="">
                    Criar nova categoria
                  </NativeSelectOption>
                  {categories(config).map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {item}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
            )}
            {adding === 'category' && categoryTarget && (
              <label className="fixed-rule">
                <Switch
                  checked={categoryActive(config, categoryTarget)}
                  onCheckedChange={(active) =>
                    onSave({
                      ...config,
                      business: {
                        ...b,
                        disabledCategories: active
                          ? (b.disabledCategories || []).filter(
                              (item) => item !== categoryTarget,
                            )
                          : Array.from(
                              new Set([
                                ...(b.disabledCategories || []),
                                categoryTarget,
                              ]),
                            ),
                      },
                    })
                  }
                />
                <span>
                  Categoria ativa para a IA
                  <small>
                    Desative para impedir que todos os serviços desta categoria
                    sejam oferecidos.
                  </small>
                </span>
              </label>
            )}
            <label className="field">
              {adding === 'category' ? 'Nome da categoria' : 'Nome do serviço'}
              <input
                name="name"
                required
                maxLength={adding === 'category' ? 80 : 100}
                value={adding === 'category' ? categoryName : undefined}
                onChange={
                  adding === 'category'
                    ? (event) => setCategoryName(event.target.value)
                    : undefined
                }
              />
            </label>
            {adding === 'service' && (
              <>
                <label className="field">
                  Categoria
                  <NativeSelect name="category" required>
                    {categories(config).map((c) => (
                      <NativeSelectOption key={c}>{c}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
                <label className="field">
                  Descrição para o atendimento
                  <textarea
                    name="description"
                    maxLength={1000}
                    rows={3}
                    placeholder="Explique o serviço e as condições confirmadas."
                  />
                </label>
                <p>
                  Este serviço será marcado como oferecido pela empresa. Revise
                  antes de salvar.
                </p>
              </>
            )}
            {formError && <p role="alert">{formError}</p>}
            {adding === 'category' && categoryTarget && (
              <button
                type="button"
                className="btn outline full"
                onClick={() => {
                  const fallback =
                    categoryTarget === 'Outros serviços'
                      ? 'Geral'
                      : 'Outros serviços';
                  onSave({
                    ...config,
                    business: {
                      ...b,
                      categories: (b.categories || []).filter(
                        (item) => item !== categoryTarget,
                      ),
                      disabledCategories: (b.disabledCategories || []).filter(
                        (item) => item !== categoryTarget,
                      ),
                      products: b.products.map((product) =>
                        allCatalogue(config).find(
                          (item) => item[0] === product.id,
                        )?.[2] === categoryTarget
                          ? { ...product, category: fallback }
                          : product,
                      ),
                    },
                  });
                  setAdding(null);
                }}
              >
                <Trash2 size={17} />
                Remover categoria
              </button>
            )}
            <button className="btn primary full">
              <Save size={17} />
              Salvar {adding === 'category' ? 'categoria' : 'serviço'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
