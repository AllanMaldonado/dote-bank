const assert = require('node:assert/strict');
const { test } = require('node:test');
const env = require('../src/config/env');

env.gemini.apiKey = 'chave-ficticia';
env.gemini.modelos = ['gemini-3.6-flash'];

const iaService = require('../src/services/iaService');

const analiseValida =
  'Resumo:\nAs entradas superaram as saídas.\nPadrões:\nMoradia teve maior peso.\nDicas:\nRevise os limites.';

const relatorio = {
  periodo: { inicio: new Date('2026-01-01'), fim: new Date('2026-01-31') },
  saldoAtualCentavos: 40000,
  caixinhasCentavos: 3000,
  totais: {
    entradasCentavos: 10000,
    saidasCentavos: 2500,
    rendimentosCentavos: 300,
    resultadoCentavos: 7800,
    transacoes: 3,
  },
  meses: [{ mes: '2026-01', entradasCentavos: 10000, saidasCentavos: 2500, rendimentosCentavos: 300 }],
  categorias: [
    { categoria: 'Moradia', totalCentavos: 2000 },
    { categoria: 'rotulo-antigo@exemplo.com', totalCentavos: 500 },
  ],
  destinatarios: [{ nome: 'Pessoa identificável', totalCentavos: 2500 }],
};

const retorno = (content) => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });

test('envia ao Gemini 3.6 Flash apenas os agregados permitidos do relatório', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => retorno(analiseValida));
  const r = await iaService.analisarRelatorio(relatorio);
  assert.deepEqual(r, { texto: analiseValida, modelo: 'gemini-3.6-flash', fonte: 'gemini' });

  const [[url, opcoes]] = fetch.mock.calls.map((call) => call.arguments);
  assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
  assert.equal(opcoes.headers.Authorization, 'Bearer chave-ficticia');
  assert.ok(opcoes.signal instanceof AbortSignal);
  const corpo = JSON.parse(opcoes.body);
  assert.equal(corpo.model, 'gemini-3.6-flash');
  const dados = JSON.parse(corpo.messages[1].content);
  assert.match(dados.porMes[0].rendimentos, /3,00/);
  assert.deepEqual(
    dados.gastosPorCategoria.map((g) => g.categoria),
    ['Moradia', 'Outros'],
  );
  assert.doesNotMatch(opcoes.body, /Pessoa identificável|rotulo-antigo|chave-ficticia/);
});

test('retorna análise por regras quando o Gemini devolve texto sem as seções', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => retorno('Texto sem estrutura'));
  t.mock.method(console, 'warn', () => {});
  const r = await iaService.analisarRelatorio(relatorio);
  assert.equal(r.fonte, 'regras');
  assert.equal(r.motivo, 'resposta_invalida');
  assert.match(r.texto, /^Resumo:/);
  assert.match(r.texto, /Moradia concentrou 80%/);
});

for (const [status, motivo] of [
  [400, 'requisicao_recusada'],
  [401, 'credencial_recusada'],
  [403, 'credencial_recusada'],
  [404, 'modelo_indisponivel'],
  [429, 'limite_provedor'],
  [503, 'provedor_indisponivel'],
]) {
  test(`identifica a falha HTTP ${status} sem expor a resposta do provedor`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status }));
    const avisos = t.mock.method(console, 'warn', () => {});
    const r = await iaService.analisarRelatorio(relatorio);
    assert.equal(r.fonte, 'regras');
    assert.equal(r.motivo, motivo);
    assert.match(r.aviso, /sem IA/);
    assert.doesNotMatch(JSON.stringify([r, avisos.mock.calls]), /chave-ficticia/);
  });
}

test('reserva 25 segundos ao modelo único e identifica tempo esgotado', async (t) => {
  const timeout = t.mock.method(AbortSignal, 'timeout', () => new AbortController().signal);
  t.mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Tempo excedido', 'TimeoutError');
  });
  t.mock.method(console, 'warn', () => {});
  const r = await iaService.analisarRelatorio(relatorio);
  assert.equal(r.motivo, 'tempo_esgotado');
  assert.match(r.aviso, /demorou/);
  assert.ok(timeout.mock.calls[0].arguments[0] > 24_000);
  assert.ok(timeout.mock.calls[0].arguments[0] <= 25_000);
});

test('usa um novo sinal para tentar o próximo modelo após timeout', async (t) => {
  env.gemini.modelos = ['modelo-a', 'modelo-b'];
  t.after(() => { env.gemini.modelos = ['gemini-3.6-flash']; });
  const sinais = [];
  t.mock.method(globalThis, 'fetch', async (url, opcoes) => {
    sinais.push(opcoes.signal);
    if (sinais.length === 1) throw new DOMException('Tempo excedido', 'TimeoutError');
    return retorno(analiseValida);
  });
  t.mock.method(console, 'warn', () => {});
  const r = await iaService.analisarRelatorio(relatorio);
  assert.equal(r.fonte, 'gemini');
  assert.equal(r.modelo, 'modelo-b');
  assert.notEqual(sinais[0], sinais[1]);
  assert.equal(sinais[1].aborted, false);
});
