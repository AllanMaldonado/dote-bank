import { formatDiaMes } from './datas';

const TITULOS = {
  deposito_inicial: () => 'Depósito inicial',
  transferencia: (t) => (t.direcao === 'entrada' ? 'Transferência recebida' : 'Transferência enviada'),
  recorrencia: (t) => (t.direcao === 'entrada' ? 'Transferência agendada recebida' : 'Transferência agendada'),
  rendimento: (t) => (t.caixinha ? 'Rendimento da caixinha' : 'Rendimento do mês'),
  caixinha_aplicacao: () => 'Aplicação na caixinha',
  caixinha_resgate: () => 'Resgate da caixinha',
};

const ICONES = {
  deposito_inicial: 'mdi-bank-outline',
  rendimento: 'mdi-chart-line',
  recorrencia: 'mdi-calendar-sync-outline',
};

export function itemDoExtrato(t) {
  const contraparte = t.direcao === 'entrada' ? t.origem?.nome : t.destino?.nome;
  const detalhe = [contraparte ?? t.caixinha ?? t.descricao, t.direcao === 'saida' ? t.categoria : null];
  const negativo = t.direcao === 'saida' || t.tipo === 'caixinha_aplicacao';
  return {
    tipo: t.direcao,
    titulo: TITULOS[t.tipo]?.(t) ?? t.tipo,
    subtitulo: detalhe.filter(Boolean).join(' · '),
    data: formatDiaMes(t.data),
    valorCentavos: negativo ? -t.valorCentavos : t.valorCentavos,
    icone: ICONES[t.tipo] ?? '',
    falhou: t.status === 'falhou',
    to: `/comprovante/${t.id}`,
  };
}

export const tituloDaTransacao = (t) => TITULOS[t.tipo]?.(t) ?? t.tipo;
