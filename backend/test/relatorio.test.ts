const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco } = require('./helpers');

const relogioService = require('../src/services/relogioService');
const geminiService = require('../src/services/geminiService');

describe('relatório por período e Diamante', () => {
  let admin, ana, bruno, carla;
  before(async () => {
    await iniciarBanco();
    await relogioService.definirData(new Date('2026-01-10T00:00:00Z'));
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    carla = await criarClienteAtivo(admin, 'Carla Dias');
    for (const c of [bruno, carla]) await c.agente.post('/api/pix/chaves').send({ tipo: 'email' }).expect(201);
    await ana.agente.post('/api/pix/chaves').send({ tipo: 'email' }).expect(201);

    const pix = (de, para, valorCentavos, categoria) =>
      de.agente.post('/api/pix/transferencias').send({ chave: para.dados.email, valorCentavos, categoria }).expect(201);
    await pix(ana, bruno, 65000, 'Moradia');
    await pix(ana, carla, 20000, 'Alimentação');
    await pix(bruno, ana, 12000, 'Lazer');
    await relogioService.definirData(new Date('2026-02-15T00:00:00Z'));
    await pix(ana, carla, 10000, 'Alimentação');
    const cx = await ana.agente.post('/api/caixinhas').send({ nome: 'Viagem' }).expect(201);
    await ana.agente.post(`/api/caixinhas/${cx.body.id}/aplicar`).send({ valorCentavos: 5000 }).expect(200);
  });
  after(async () => {
    geminiService.definirClienteIA(null);
    await encerrarBanco();
  });

  test('totais, meses, categorias e destinatários do ano', async () => {
    const r = await ana.agente.get('/api/relatorio').expect(200);
    assert.equal(r.body.periodo.inicio, '2026-01-01T00:00:00.000Z');
    assert.equal(r.body.periodo.fim, '2026-02-15T00:00:00.000Z');
    assert.equal(r.body.totais.entradasCentavos, 100000 + 12000);  
    assert.equal(r.body.totais.saidasCentavos, 65000 + 20000 + 10000);
    assert.equal(r.body.totais.resultadoCentavos, 112000 - 95000);
    assert.equal(r.body.caixinhasCentavos, 5000);
    assert.deepEqual(
      r.body.meses.map((m) => m.mes),
      ['2026-01', '2026-02'],
    );
    assert.equal(r.body.meses[1].saidasCentavos, 10000);
    assert.deepEqual(
      r.body.categorias.map((c) => c.categoria),
      ['Moradia', 'Alimentação'],
    );
    assert.equal(r.body.categorias[0].percentual, 68);
    assert.equal(r.body.destinatarios[0].nome, 'Bruno Lima');
    assert.equal(r.body.destinatarios[1].quantidade, 2);
  });

  test('filtra por período e valida datas', async () => {
    const fev = await ana.agente.get('/api/relatorio?inicio=2026-02-01&fim=2026-02-28').expect(200);
    assert.equal(fev.body.totais.saidasCentavos, 10000);
    assert.equal(fev.body.totais.entradasCentavos, 0);
    await ana.agente.get('/api/relatorio?inicio=2026-03-01&fim=2026-01-01').expect(400);
    await ana.agente.get('/api/relatorio?inicio=ontem').expect(400);
  });

  test('filtra os valores do relatório e da análise pela categoria e pelo período', async () => {
    const filtros = { inicio: '2026-01-01', fim: '2026-01-31', categoria: 'Alimentação' };
    const relatorio = await ana.agente.get('/api/relatorio').query(filtros).expect(200);
    assert.equal(relatorio.body.totais.saidasCentavos, 20000);
    assert.equal(relatorio.body.totais.transacoes, 1);
    assert.deepEqual(relatorio.body.categorias, [{ categoria: 'Alimentação', totalCentavos: 20000, percentual: 100 }]);
    geminiService.definirClienteIA(null);
    const analise = await ana.agente.post('/api/relatorio/analise').send(filtros).expect(200);
    assert.match(analise.body.texto, /Alimentação concentrou 100%/);
    await ana.agente.get('/api/relatorio').query({ categoria: 'Inválida' }).expect(400);
  });

  test('a rota removida do calendário devolve 404', async () => {
    await ana.agente.get('/api/relatorio/calendario').expect(404);
  });

  test('admin vê o relatório de qualquer cliente; cliente não usa a rota do admin', async () => {
    const r = await admin.get(`/api/admin/clientes/${ana.id}/relatorio`).expect(200);
    assert.equal(r.body.totais.saidasCentavos, 95000);
    await bruno.agente.get(`/api/admin/clientes/${ana.id}/relatorio`).expect(403);
  });

  test('Diamante usa a IA com dados agregados, sem dados pessoais', async () => {
    let recebido;
    geminiService.definirClienteIA(async (mensagens) => {
      recebido = mensagens;
      return '**Resumo:**\nVocê gastou bastante com moradia.\nPadrões:\n...\nDicas:\n...';
    });
    const r = await ana.agente.post('/api/relatorio/analise').send({}).expect(200);
    assert.equal(r.body.fonte, 'gemini');
    assert.match(r.body.texto, /^Resumo:/);  
    const enviado = JSON.stringify(recebido);
    assert.match(enviado, /Moradia/);
    assert.doesNotMatch(enviado, new RegExp(ana.dados.cpf));
    assert.doesNotMatch(enviado, /@teste.dote.com/);
    assert.doesNotMatch(enviado, /\b(Ana|Bruno|Carla|Lima|Souza|Dias|destinatarios)\b/i);

    const doAdmin = await admin.post(`/api/admin/clientes/${ana.id}/relatorio/analise`).send({}).expect(200);
    assert.equal(doAdmin.body.fonte, 'gemini');
  });

  test('sem IA (ou se ela falhar) a análise sai por regras, avisando', async () => {
    geminiService.definirClienteIA(async () => {
      throw new Error('timeout');
    });
    const falhou = await ana.agente.post('/api/relatorio/analise').send({}).expect(200);
    assert.equal(falhou.body.fonte, 'regras');
    assert.match(falhou.body.aviso, /sem IA/);
    assert.match(falhou.body.texto, /Moradia/);

    geminiService.definirClienteIA(null);
    const semChave = await ana.agente.post('/api/relatorio/analise').send({ inicio: '2026-02-01' }).expect(200);
    assert.equal(semChave.body.fonte, 'regras');
    assert.match(semChave.body.texto, /^Resumo:/);
  });
});
