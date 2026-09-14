import { business, relevantProducts } from '../business-model';
import { normalize, type Config, type Lead } from '../recovery-model';
import type { Decision } from './gemini';
export function validateDecision(
  config: Config,
  lead: Lead,
  question: string,
  result: Decision,
): Decision {
  if (result.action === 'stop') return result;
  const q = normalize(question);
  const first = !lead.messages.some(
    (m) => m.role === 'ia' && m.provider === 'Gemini',
  );
  const intro = first
    ? 'Olá, sou ' +
      config.assistant +
      ', assistente virtual da ' +
      config.company +
      '. '
    : '';
  const relevant = relevantProducts(config, question),
    products = relevant.filter(
      (p) => p.state !== 'Oferecemos' || !p.categoryActive,
    ),
    offered = relevant.filter(
      (p) => p.state === 'Oferecemos' && p.categoryActive,
    );
  let text = '',
    reason = '',
    action: Decision['action'] = 'clarify';
  if (
    offered.length === 1 &&
    /(quero|gostaria|preciso|querendo|faz|ofere|trabalh)/.test(q) &&
    !/(preco|valor|quanto|prazo|garanti|durabili|instala|desconto)/.test(q)
  ) {
    const nextQuestion =
      offered[0].qualificationQuestions?.[0] ||
      'Pode informar as medidas aproximadas e, se possível, enviar uma foto do local?';
    text = `Sim, trabalhamos com ${offered[0].name}. ${nextQuestion}`;
    reason = 'Produto oferecido identificado na solicitação do cliente.';
    action = 'reply';
  }
  if (
    products.length &&
    /faz|ofere|trabalh|tem|possivel|consegue|voces/.test(q)
  ) {
    text =
      (text ? text + ' ' : '') +
      products
        .map((p) =>
          p.state === 'Não oferecemos'
            ? 'Não oferecemos ' + p.name + '.'
            : !p.categoryActive
              ? 'Esse serviço não está entre os serviços ativos da empresa.'
              : 'Preciso confirmar com o vendedor se oferecemos ' +
                p.name +
                '.',
        )
        .join(' ');
    reason = 'Estado do catálogo validado pelo servidor; não presumir oferta.';
    action = products.some((p) => p.state === 'Não configurado')
      ? 'handoff'
      : 'reply';
  }
  if (/instala/.test(q) && /inclus|inclui|incluid|cobr|valor|preco/.test(q)) {
    text =
      'A disponibilidade de instalação não confirma que ela esteja inclusa. Precisamos validar as condições atuais deste acompanhamento com o vendedor.';
    reason = 'Inclusão da instalação não confirmada como condição vigente.';
    action = 'handoff';
  }
  if (
    /prazo|quando.*(entreg|pront)|garanti|durabili|vida util|resisten|espess/.test(
      q,
    )
  ) {
    text +=
      (text ? ' ' : '') +
      'As condições de prazo, garantia ou desempenho precisam de confirmação específica; não tenho uma informação aprovada para prometer isso.';
    reason = 'Informação comercial ou técnica crítica não confirmada.';
    action = 'handoff';
  }
  return text
    ? {
        ...result,
        text: intro + text,
        action,
        reason,
        summary: reason,
        references: [...result.references, 'central:output-validation-v1'],
      }
    : result;
}
