import { privacidade } from './privacidade';

export const SIMBOLO_PONTOS = 'P$';
const pontos = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(centavos, { sinal = false, sempre = false } = {}) {
  const prefixo = centavos < 0 ? '−' : sinal ? '+' : '';
  if (privacidade.oculto && !sempre) return `${SIMBOLO_PONTOS} ••••`;
  return `${prefixo}${SIMBOLO_PONTOS} ${pontos.format(Math.abs(centavos) / 100)}`;
}

const pct = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
export const formatPercentual = (n) => (n == null ? '–' : `${pct.format(n)}%`);
