const { CATEGORIAS } = require('../models/constantes');
const { exibirPontos, formatMoney } = require('../utils/dinheiro');
const geminiService = require('./geminiService');

const AVISOS = {
  tempo_esgotado: 'A IA demorou para responder. Análise automática sem IA.',
  credencial_recusada: 'A configuração de acesso à IA precisa ser revisada. Análise automática sem IA.',
  limite_provedor: 'A IA atingiu o limite de uso do provedor. Análise automática sem IA.',
  modelo_indisponivel: 'O modelo de IA configurado está indisponível. Análise automática sem IA.',
  requisicao_recusada: 'O provedor recusou a solicitação de IA. Análise automática sem IA.',
  resposta_invalida: 'A IA devolveu uma resposta incompleta ou fora do formato. Análise automática sem IA.',
  provedor_indisponivel: 'O Gemini está indisponível. Análise automática sem IA.',
};

const INSTRUCOES = `Você é o Diamante, assistente do DOTE, um banco simulado.
Responda em português do Brasil, em texto simples. Use apenas os dados financeiros fornecidos.
Os valores são pontos fictícios do DOTE. Escreva montantes com o prefixo P$.
Não invente valores, pessoas, causas de gastos, transações ou funcionalidades. Não prometa executar operações.
Diferencie saldo atual de resultado do período. Rendimentos são separados das entradas.
Ao sugerir ações, limite-se a acompanhamento de gastos e caixinhas do app.`;

const INSTRUCOES_RELATORIO = `${INSTRUCOES}
Responda em até 180 palavras. Use três seções com conteúdo, nesta ordem e com cada título em sua própria linha:
Resumo:
Padrões:
Dicas:
No resumo, compare entradas, saídas e rendimentos. Nos padrões, destaque as categorias ou meses relevantes.
Considere a ausência de movimentações antes de tirar conclusões. Dê dicas práticas e proporcionais ao cenário.`;

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const mesPorExtenso = (chave) => nomeDoMes.format(new Date(`${chave}-01T00:00:00Z`));
const diaIso = (data) => data.toISOString().slice(0, 10);
const categoriaSegura = (categoria) => (CATEGORIAS.includes(categoria) ? categoria : 'Outros');

function limpar(texto, limite) {
  if (typeof texto !== 'string') return '';
  return exibirPontos(texto)
    .replace(/\*\*|__|^#+[ \t]*/gm, '')
    .trim()
    .slice(0, limite)
    .trimEnd();
}

function tratarAnalise(texto) {
  const analise = limpar(texto, 2500);
  const secoes = analise.match(/^Resumo:\s*([\s\S]+?)\nPadrões:\s*([\s\S]+?)\nDicas:\s*([\s\S]+)$/u);
  return secoes?.slice(1).every((secao) => secao.trim()) ? analise : '';
}

function gastosPorCategoria(relatorio) {
  const gastos = new Map();
  for (const { categoria, totalCentavos } of relatorio.categorias) {
    const chave = categoriaSegura(categoria);
    gastos.set(chave, (gastos.get(chave) ?? 0) + totalCentavos);
  }
  const saidas = relatorio.totais.saidasCentavos;
  return [...gastos]
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, total]) => ({
      categoria,
      total: formatMoney(total),
      percentual: saidas ? Math.round((total / saidas) * 100) : 0,
    }));
}

function fluxo({ entradasCentavos, saidasCentavos, rendimentosCentavos }) {
  return {
    entradas: formatMoney(entradasCentavos),
    saidas: formatMoney(saidasCentavos),
    rendimentos: formatMoney(rendimentosCentavos),
  };
}

function dadosDoRelatorio(r) {
  return {
    periodo: { inicio: diaIso(r.periodo.inicio), fim: diaIso(r.periodo.fim) },
    saldoAtual: formatMoney(r.saldoAtualCentavos),
    totalEmCaixinhas: formatMoney(r.caixinhasCentavos),
    ...fluxo(r.totais),
    resultado: formatMoney(r.totais.resultadoCentavos),
    movimentacoes: r.totais.transacoes,
    porMes: r.meses.map((m) => ({ mes: m.mes, ...fluxo(m) })),
    gastosPorCategoria: gastosPorCategoria(r),
  };
}

function analisePorRegras(r, dados) {
  const { entradas, saidas, rendimentos, resultado } = dados;
  const [maiorCategoria] = dados.gastosPorCategoria;
  const mesMaisGasto = r.meses.reduce((a, m) => (m.saidasCentavos > (a?.saidasCentavos ?? 0) ? m : a), null);
  const resumo = `Entradas de ${entradas}, saídas de ${saidas} e rendimentos de ${rendimentos}. Resultado de ${resultado}.`;
  const padroes = maiorCategoria
    ? `${maiorCategoria.categoria} concentrou ${maiorCategoria.percentual}% das saídas.`
    : 'Não houve saídas no período.';
  const mes = mesMaisGasto ? ` O mês com mais saídas foi ${mesPorExtenso(mesMaisGasto.mes)}.` : '';
  const dica =
    r.totais.resultadoCentavos < 0
      ? 'Revise as maiores despesas e acompanhe seus limites por categoria.'
      : 'Acompanhe os gastos no extrato e use caixinhas para separar dinheiro por objetivo.';
  return `Resumo:\n${resumo}\n\nPadrões:\n${padroes}${mes}\n\nDicas:\n${dica}`;
}

const mensagens = (instrucoes, dados) => [
  { role: 'system', content: instrucoes },
  { role: 'user', content: JSON.stringify(dados) },
];

class IaService {
  async analisarRelatorio(relatorio) {
    const dados = dadosDoRelatorio(relatorio);
    const disponivel = geminiService.disponivel();
    let falha;
    if (disponivel) {
      const resultado = await geminiService.gerar(mensagens(INSTRUCOES_RELATORIO, dados), tratarAnalise);
      if (resultado?.texto) return { ...resultado, fonte: 'gemini' };
      falha = resultado?.falha ?? 'provedor_indisponivel';
    }
    return {
      texto: analisePorRegras(relatorio, dados),
      fonte: 'regras',
      ...(falha && { motivo: falha }),
      aviso: disponivel
        ? AVISOS[falha]
        : 'Gemini não configurado. Análise automática sem IA.',
    };
  }
}

module.exports = new IaService();
