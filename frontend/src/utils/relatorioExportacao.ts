import { formatData, formatMes, isoDia } from './datas.js';
import { formatMoney as formatar, formatPercentual } from './formatMoney.js';

const formatMoney = (centavos) => formatar(centavos, { sempre: true });

const TITULO = 'Relatório financeiro';
const NOTA =
  'O resultado soma entradas e rendimentos e subtrai saídas. Transferências entre conta e caixinhas não entram no fluxo.';
const NOTA_SALDO =
  'Saldo em conta e valor em caixinhas são os valores atuais, mesmo quando o relatório usa um período anterior.';

const html = (texto) =>
  String(texto).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  );

const md = (texto) =>
  html(texto)
    .replace(/[\\`*_{}\[\]()#|~]/g, '\\$&')
    .replace(/\r?\n/g, ' ');

function montar(r, analise) {
  const { totais } = r;
  const indicadores = [
    ['Entradas', totais.entradasCentavos],
    ['Saídas', totais.saidasCentavos],
    ['Rendimentos', totais.rendimentosCentavos],
    ['Resultado do período', totais.resultadoCentavos],
    ['Saldo atual em conta', r.saldoAtualCentavos],
    ['Guardado em caixinhas', r.caixinhasCentavos],
  ];
  const secoes = analise?.texto.match(/^Resumo:\s*([\s\S]+?)\nPadrões:\s*([\s\S]+?)\nDicas:\s*([\s\S]+)$/u);
  return {
    periodo: `${formatData(r.periodo.inicio)} a ${formatData(r.periodo.fim)}`,
    transacoes: totais.transacoes,
    indicadores,
    meses: r.meses,
    categorias: r.categorias,
    analise: analise && {
      origem: analise.fonte === 'gemini' ? `IA · ${analise.modelo}` : 'Análise automática por regras',
      secoes: secoes
        ? [
            ['Resumo', secoes[1].trim()],
            ['Padrões', secoes[2].trim()],
            ['Dicas', secoes[3].trim()],
          ]
        : [['Leitura do período', analise.texto]],
    },
  };
}

export function nomeDoRelatorio(r) {
  return `dote-relatorio-${isoDia(r.periodo.inicio)}_${isoDia(r.periodo.fim)}`;
}

const linhaMd = (campos) => `| ${campos.map(md).join(' | ')} |`;
const tabelaMd = (cabecalho, linhas) =>
  [linhaMd(cabecalho), linhaMd(cabecalho.map(() => '---')), ...linhas.map(linhaMd)].join('\n');

export function gerarMarkdown(r, analise) {
  const d = montar(r, analise);
  const blocos = [
    `# DOTE · ${TITULO}`,
    `**Período** ${d.periodo}\n\n**Movimentações concluídas** ${d.transacoes}`,
    '## Visão geral',
    tabelaMd(
      ['Indicador', 'Valor'],
      d.indicadores.map(([nome, valor]) => [nome, formatMoney(valor)]),
    ),
    NOTA,
    NOTA_SALDO,
    '## Movimentação mensal',
    tabelaMd(
      ['Mês', 'Entradas', 'Saídas', 'Rendimentos'],
      d.meses.map((m) => [
        formatMes(m.mes),
        formatMoney(m.entradasCentavos),
        formatMoney(m.saidasCentavos),
        formatMoney(m.rendimentosCentavos),
      ]),
    ),
    '## Gastos por categoria',
    d.categorias.length
      ? tabelaMd(
          ['Categoria', 'Total', '% das saídas'],
          d.categorias.map((c) => [c.categoria, formatMoney(c.totalCentavos), formatPercentual(c.percentual)]),
        )
      : 'Sem saídas no período.',
  ];
  if (d.analise) {
    blocos.push('## Leitura do Diamante', md(d.analise.origem));
    for (const [titulo, texto] of d.analise.secoes) blocos.push(`### ${titulo}`, md(texto));
  }
  return blocos.join('\n\n') + '\n';
}

function barra(percentual, serie) {
  const largura = Math.min(100, Math.max(0, percentual)).toFixed(2);
  return `<svg class="barra ${serie}" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
    <rect class="trilho" width="100" height="4"/><rect class="valor" width="${largura}" height="4"/>
  </svg>`;
}

const valorHtml = (valor) => html(formatMoney(valor));
const tabelaHtml = (titulos, linhas) => `<table>
  <thead><tr>${titulos.map((t) => `<th scope="col">${t}</th>`).join('')}</tr></thead>
  <tbody>${linhas.join('')}</tbody>
</table>`;

function visaoGeral(d) {
  const indicadores = d.indicadores
    .map(
      ([nome, valor]) => `<div class="indicador">
    <dt>${nome}</dt><dd>${valorHtml(valor)}</dd>
  </div>`,
    )
    .join('');
  return `<section>
    <h2>Visão geral</h2><dl>${indicadores}</dl>
    <p class="nota">${NOTA} ${NOTA_SALDO}</p>
  </section>`;
}

function movimentacaoMensal(meses) {
  const maximo = Math.max(1, ...meses.flatMap((m) => [m.entradasCentavos, m.saidasCentavos]));
  const linhas = meses.map(
    (m) => `<tr>
    <th scope="row">${html(formatMes(m.mes))}</th>
    <td>${valorHtml(m.entradasCentavos)}${barra((m.entradasCentavos / maximo) * 100, 'entrada')}</td>
    <td>${valorHtml(m.saidasCentavos)}${barra((m.saidasCentavos / maximo) * 100, 'saida')}</td>
    <td>${valorHtml(m.rendimentosCentavos)}</td>
  </tr>`,
  );
  return `<section>
    <h2>Movimentação mensal</h2>
    ${tabelaHtml(['Mês', 'Entradas', 'Saídas', 'Rendimentos'], linhas)}
  </section>`;
}

function gastosPorCategoria(categorias) {
  const linhas = categorias.map(
    (c) => `<tr>
    <th scope="row">${html(c.categoria)}</th>
    <td>${valorHtml(c.totalCentavos)}</td>
    <td>${html(formatPercentual(c.percentual))}${barra(c.percentual, 'saida')}</td>
  </tr>`,
  );
  return `<section>
    <h2>Gastos por categoria</h2>
    ${linhas.length ? tabelaHtml(['Categoria', 'Total', '% das saídas'], linhas) : '<p>Sem saídas no período.</p>'}
  </section>`;
}

function leitura(analise) {
  if (!analise) return '';
  const secoes = analise.secoes
    .map(([titulo, texto]) => `<div class="leitura"><h3>${titulo}</h3><p>${html(texto)}</p></div>`)
    .join('');
  return `<section>
    <h2>Leitura do Diamante</h2>
    <p class="nota">${html(analise.origem)}</p>
    ${secoes}
  </section>`;
}

export function gerarHtml(r, analise, { cores, css, fonte }) {
  const d = montar(r, analise);
  const tokens = ['surface', 'surface-bright', 'on-surface', 'muted', 'outline', 'primary', 'error'];
  const variaveis = tokens
    .map((token) => {
      const cor = cores[token].slice(1);
      const canais = [0, 2, 4].map((inicio) => Number.parseInt(cor.slice(inicio, inicio + 2), 16));
      return `--v-theme-${token}:${canais.join(',')};`;
    })
    .join('');
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:">
  <title>DOTE · ${TITULO}</title>
  <style>
    @font-face { font-family: 'Share Tech Mono'; src: url('${fonte}') format('woff2'); font-weight: 400; }
    :root { ${variaveis} }
    ${css}
  </style>
</head>
<body>
  <main>
    <header>
      <p class="marca">dote / extrato</p>
      <h1>${TITULO}</h1>
      <p class="periodo">${d.periodo} · ${d.transacoes} movimentações concluídas</p>
    </header>
    ${visaoGeral(d)}
    ${leitura(d.analise)}
    ${movimentacaoMensal(d.meses)}
    ${gastosPorCategoria(d.categorias)}
    <footer>DOTE · Banco digital simulado</footer>
  </main>
</body>
</html>`;
}
