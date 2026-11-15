const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { app, criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco, request } = require('./helpers');
const env = require('../src/config/env');
const geminiService = require('../src/services/geminiService');
const relogioService = require('../src/services/relogioService');

describe('análise do Diamante', () => {
  let admin, ana;
  const modelosOriginais = [...env.gemini.modelos];
  const analisar = (corpo = {}) => ana.agente.post('/api/relatorio/analise').send(corpo);

  before(async () => {
    await iniciarBanco();
    await relogioService.definirData(new Date('2026-03-10T00:00:00Z'));
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
  });
  after(async () => {
    geminiService.definirClienteIA(null);
    env.gemini.modelos = modelosOriginais;
    await encerrarBanco();
  });

  test('a rota de chat não existe mais', async () => {
    await ana.agente.post('/api/ia/chat').send({ mensagem: 'oi' }).expect(404);
  });

  test('fallback de modelos: erro ou 429 passa ao próximo; todos falhando cai nas regras', async () => {
    env.gemini.modelos = ['modelo-a', 'modelo-b', 'modelo-c'];
    const chamados = [];
    geminiService.definirClienteIA(async (mensagens, modelo) => {
      chamados.push(modelo);
      if (modelo === 'modelo-a') throw new Error('Gemini respondeu HTTP 429');
      if (modelo === 'modelo-b') throw new Error('Gemini respondeu HTTP 500');
      return 'Resumo:\nok\nPadrões:\nok\nDicas:\nok';
    });
    const r = await analisar().expect(200);
    assert.deepEqual(chamados, ['modelo-a', 'modelo-b', 'modelo-c']);
    assert.equal(r.body.fonte, 'gemini');
    assert.equal(r.body.modelo, 'modelo-c');

    chamados.length = 0;
    geminiService.definirClienteIA(async (mensagens, modelo) => {
      chamados.push(modelo);
      return 'Resumo:\nok\nPadrões:\nok\nDicas:\nok';
    });
    assert.equal((await analisar().expect(200)).body.modelo, 'modelo-a');
    assert.deepEqual(chamados, ['modelo-a']);

    geminiService.definirClienteIA(async () => {
      throw new Error('fora do ar');
    });
    const falhou = await analisar().expect(200);
    assert.equal(falhou.body.fonte, 'regras');
    assert.match(falhou.body.aviso, /sem IA/);
    assert.match(falhou.body.texto, /^Resumo:/);
    env.gemini.modelos = modelosOriginais;
  });

  test('exige cliente autenticado', async () => {
    await request(app).post('/api/relatorio/analise').send({}).expect(401);
    await admin.post('/api/relatorio/analise').send({}).expect(403);
  });
});
