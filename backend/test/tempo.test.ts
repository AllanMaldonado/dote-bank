const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco } = require('./helpers');

const Caixinha = require('../src/models/Caixinha');
const Config = require('../src/models/Config');
const Transacao = require('../src/models/Transacao');
const recorrenciaService = require('../src/services/recorrenciaService');
const relogioService = require('../src/services/relogioService');
const tempoService = require('../src/services/tempoService');

describe('motor de tempo: rendimentos e Transferência agendada', () => {
  let admin, ana, bruno, carla, caixinhaId;
  before(async () => {
    await iniciarBanco();
    await relogioService.definirData(new Date('2026-01-02T00:00:00Z'));
    await relogioService.atualizarTaxas({ indicePointsAnual: 10, percentualCaixinha: 140 });
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    carla = await criarClienteAtivo(admin, 'Carla Dias');
    await bruno.agente.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);

    await ana.agente
      .post('/api/transferencias/agendamentos')
      .send({
        chave: bruno.dados.email,
        valorCentavos: 50000,
        diaDoMes: 5,
        categoria: 'Moradia',
        descricao: 'Aluguel',
      })
      .expect(201);
    const c = await ana.agente.post('/api/caixinhas').send({ nome: 'Reserva' }).expect(201);
    caixinhaId = c.body.id;
    await ana.agente.post(`/api/caixinhas/${caixinhaId}/aplicar`).send({ valorCentavos: 50000 }).expect(200);

    await carla.agente
      .post('/api/transferencias/agendamentos')
      .send({ chave: bruno.dados.email, valorCentavos: 900000, diaDoMes: 10, categoria: 'Contas', descricao: 'Carro' })
      .expect(201);
  });
  after(encerrarBanco);

  test('valida o pedido e só o admin avança o relógio', async () => {
    await ana.agente.post('/api/admin/relogio/avancar').send({ dias: 1 }).expect(403);
    await admin.post('/api/admin/relogio/avancar').send({}).expect(400);
    await admin.post('/api/admin/relogio/avancar').send({ dias: 0 }).expect(400);
    await admin.post('/api/admin/relogio/avancar').send({ dias: 1, meses: 1 }).expect(400);
    await admin.post('/api/admin/relogio/avancar').send({ dias: 1000 }).expect(400);
    await admin.post('/api/admin/relogio/avancar').send({ ate: '2025-12-31' }).expect(400);
  });

  test('avançar 1 mês executa os agendamentos e lança o rendimento no dia 1', async () => {
    const r = await admin.post('/api/admin/relogio/avancar').send({ meses: 1 }).expect(200);
    assert.equal(r.body.config.dataSistema, '2026-02-02T00:00:00.000Z');
    assert.equal(r.body.resumo.dias, 31);
    assert.equal(r.body.resumo.recorrenciasExecutadas, 1);
    assert.equal(r.body.resumo.recorrenciasFalhas, 1);
    assert.ok(r.body.resumo.rendimentosCentavos > 0);

    const saidas = await ana.agente.get('/api/transacoes?tipo=saida').expect(200);
    const aluguel = saidas.body.itens.find((t) => t.tipo === 'recorrencia');
    assert.equal(aluguel.valorCentavos, 50000);
    assert.equal(aluguel.data, '2026-01-05T00:00:00.000Z');
    const rec = (await ana.agente.get('/api/transferencias/agendamentos')).body.itens[0];
    assert.equal(rec.ultimoStatus, 'concluida');

    const contaCarla = await carla.agente.get('/api/conta').expect(200);
    const extratoCarla = await carla.agente.get('/api/transacoes?tipo=saida').expect(200);
    const falha = extratoCarla.body.itens.find((t) => t.tipo === 'recorrencia');
    assert.equal(falha.status, 'falhou');
    const avisos = await carla.agente.get('/api/notificacoes').expect(200);
    assert.match(avisos.body.itens.find((n) => n.tipo === 'recorrencia_falhou').mensagem, /saldo insuficiente/);

    const rendimentos = (await ana.agente.get('/api/transacoes?tipo=entrada').expect(200)).body.itens.filter(
      (t) => t.tipo === 'rendimento',
    );
    assert.equal(rendimentos.length, 1);
    assert.ok(rendimentos.every((t) => t.data === '2026-02-01T00:00:00.000Z'));
    const daCaixinha = rendimentos.find((t) => t.caixinha === 'Reserva');
    assert.ok(
      daCaixinha.valorCentavos >= 570 && daCaixinha.valorCentavos <= 580,
      `caixinha rendeu ${daCaixinha.valorCentavos}`,
    );
    const caixinha = await ana.agente.get(`/api/caixinhas/${caixinhaId}`).expect(200);
    assert.equal(caixinha.body.saldoCentavos, 50000 + daCaixinha.valorCentavos);
    assert.ok((await ana.agente.get('/api/notificacoes')).body.itens.some((n) => n.tipo === 'rendimento'));

    const saldos = await Promise.all([ana, bruno, carla].map((c) => c.agente.get('/api/conta')));
    const total = saldos.reduce((s, r) => s + r.body.saldoCentavos + r.body.caixinhasCentavos, 0);
    assert.equal(total, 3 * 100000 + r.body.resumo.rendimentosCentavos);
    assert.equal(contaCarla.body.saldoCentavos >= 100000, true);
  });

  test('pausada não executa; avançar até uma data funciona', async () => {
    const rec = (await ana.agente.get('/api/transferencias/agendamentos')).body.itens[0];
    await ana.agente.patch(`/api/transferencias/agendamentos/${rec.id}/ativa`).send({ ativa: false }).expect(200);
    const r = await admin.post('/api/admin/relogio/avancar').send({ ate: '2026-02-06' }).expect(200);
    assert.equal(r.body.resumo.dias, 4);
    assert.equal(r.body.resumo.recorrenciasExecutadas, 0);
  });

  test('duas chamadas ao mesmo tempo: a segunda recebe 409 relogio_ocupado', async () => {
    const primeira = tempoService.avancar({ dias: 1 });
    await assert.rejects(
      tempoService.avancar({ dias: 1 }),
      (err) => err.status === 409 && err.codigo === 'relogio_ocupado',
    );
    await primeira;
    await tempoService.avancar({ dias: 1 });
  });

  test('falha no meio do dia não reaplica os juros ao repetir o avanço', async () => {
    const pendente = async () => (await Caixinha.findById(caixinhaId, 'rendimentoPendente').lean()).rendimentoPendente;
    const antes = await pendente();

    const original = recorrenciaService.executarDoDia;
    recorrenciaService.executarDoDia = async () => {
      throw new Error('queda no meio do dia');
    };
    try {
      await assert.rejects(tempoService.avancar({ dias: 1 }), /queda/);
    } finally {
      recorrenciaService.executarDoDia = original;
    }
    const aposFalha = await pendente();
    assert.ok(aposFalha > antes, 'os juros do dia foram acumulados antes da falha');

    await tempoService.avancar({ dias: 1 });
    assert.equal(await pendente(), aposFalha);
    const proximo = await tempoService.avancar({ dias: 1 });
    assert.ok(proximo.dias === 1 && (await pendente()) > aposFalha);
  });

  test('só clientes ativos acumulam juros', async () => {
    const cx = await carla.agente.post('/api/caixinhas').send({ nome: 'Reserva' }).expect(201);
    await carla.agente.post(`/api/caixinhas/${cx.body.id}/aplicar`).send({ valorCentavos: 10000 }).expect(200);
    await admin.patch(`/api/admin/clientes/${carla.id}/bloquear`).expect(200);
    const pendente = async () => (await Caixinha.findById(cx.body.id, 'rendimentoPendente').lean()).rendimentoPendente;
    const antes = (await pendente()) ?? 0;
    await tempoService.avancar({ dias: 1 });
    assert.equal((await pendente()) ?? 0, antes);
  });

  test('sincronizar exige administrador', async () => {
    await ana.agente.post('/api/admin/relogio/sincronizar').send({}).expect(403);
  });

  test('sincronizar durante um avanço retorna relógio ocupado', async () => {
    const primeira = tempoService.avancar({ dias: 1 });
    await assert.rejects(
      tempoService.sincronizarServidor(),
      (err) => err.status === 409 && err.codigo === 'relogio_ocupado',
    );
    await primeira;
  });

  test('volta à data UTC do servidor e permite processar novamente o período desfeito', async (t) => {
    const antes = await relogioService.obterConfig();
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-02T23:45:00Z').getTime() });

    const retorno = await admin.post('/api/admin/relogio/sincronizar').send({}).expect(200);
    assert.equal(retorno.body.dataSistema, '2026-01-02T00:00:00.000Z');
    const sincronizada = await relogioService.obterConfig();
    assert.equal(sincronizada.dataProcessadaAte.toISOString(), '2026-01-02T00:00:00.000Z');
    assert.equal(sincronizada.ultimoDiaJuros.toISOString(), '2026-01-02T00:00:00.000Z');
    assert.ok(retorno.body.reversao.transacoesRemovidas > 0);
    assert.equal(await Transacao.countDocuments({ data: { $gt: sincronizada.dataSistema } }), 0);

    const resumo = await tempoService.avancar({ ate: antes.dataSistema.toISOString().slice(0, 10) });
    assert.ok(resumo.rendimentosCentavos > 0);

    const antesJuros = (await Caixinha.findById(caixinhaId).lean()).rendimentoPendente;
    await tempoService.avancar({ dias: 1 });
    assert.ok((await Caixinha.findById(caixinhaId).lean()).rendimentoPendente > antesJuros);
  });

  test('sincronização repetida mantém o relógio atual e libera os dias desfeitos', async (t) => {
    const dataFutura = new Date('2028-06-10T00:00:00Z');
    await Config.updateOne({ _id: 'global' }, { $set: { dataSistema: dataFutura }, $unset: { dataProcessadaAte: '' } });
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-16T12:00:00Z').getTime() });
    await tempoService.sincronizarServidor();
    const primeira = await relogioService.obterConfig();
    await tempoService.sincronizarServidor();
    const segunda = await relogioService.obterConfig();
    assert.equal(segunda.dataSistema.toISOString(), '2026-11-16T00:00:00.000Z');
    assert.equal(segunda.dataProcessadaAte.toISOString(), '2026-11-16T00:00:00.000Z');
    assert.deepEqual(segunda.dataProcessadaAte, primeira.dataProcessadaAte);
  });
});
