const assert = require('node:assert/strict');
const { beforeEach, afterEach, describe, test } = require('node:test');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco, app, request } = require('./helpers');
const BackupReversao = require('../src/models/BackupReversao');
const Caixinha = require('../src/models/Caixinha');
const Config = require('../src/models/Config');
const DiaSimulado = require('../src/models/DiaSimulado');
const Notificacao = require('../src/models/Notificacao');
const Recorrencia = require('../src/models/TransferenciaRecorrente');
const Transacao = require('../src/models/Transacao');
const User = require('../src/models/User');
const bloqueioSistema = require('../src/services/bloqueioSistemaService');
const relogioService = require('../src/services/relogioService');
const tempoService = require('../src/services/tempoService');

describe('reversão dos efeitos da simulação', () => {
  let admin, ana, bruno, caixinhaId;
  const hoje = new Date('2026-01-02T00:00:00Z');
  const retornar = () => admin.post('/api/admin/relogio/sincronizar').send({});
  const saldos = () => User.find({}, 'saldoCentavos').sort({ _id: 1 }).lean();
  const guardarHoje = (t) => t.mock.timers.enable({ apis: ['Date'], now: hoje.getTime() + 12 * 3600000 });
  const estado = async () => ({
    contas: await saldos(),
    caixas: await Caixinha.find().sort({ _id: 1 }).lean(),
    transacoes: await Transacao.find().sort({ _id: 1 }).lean(),
    config: await relogioService.obterConfig(),
    backups: await BackupReversao.countDocuments(),
  });

  beforeEach(async () => {
    await iniciarBanco();
    await relogioService.definirData(hoje);
    await relogioService.atualizarTaxas({ indicePointsAnual: 10, percentualCaixinha: 140 });
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    await bruno.agente.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);
    const caixa = await ana.agente.post('/api/caixinhas').send({ nome: 'Reserva', metaCentavos: 50010 }).expect(201);
    caixinhaId = caixa.body.id;
    await ana.agente.post(`/api/caixinhas/${caixinhaId}/aplicar`).send({ valorCentavos: 50000 }).expect(200);
    await Caixinha.updateOne({ _id: caixinhaId }, { $set: { rendimentoPendente: 17.25 } });
    await ana.agente
      .post('/api/transferencias/agendamentos')
      .send({
        chave: bruno.dados.email,
        valorCentavos: 20000,
        diaDoMes: 5,
        categoria: 'Moradia',
        descricao: 'Aluguel',
      })
      .expect(201);
  });
  afterEach(encerrarBanco);

  test('somente o administrador pode reverter', async () => {
    await request(app).post('/api/admin/relogio/sincronizar').send({}).expect(401);
    await ana.agente.post('/api/admin/relogio/sincronizar').send({}).expect(403);
    assert.equal(await BackupReversao.countDocuments(), 0);
  });

  test('restaura saldos e juros exatos, remove lançamentos futuros e permite novo avanço', async (t) => {
    const iniciais = await saldos();
    const notificacoesIniciais = await Notificacao.countDocuments();
    const primeiro = await tempoService.avancar({ ate: '2026-02-06' });
    guardarHoje(t);
    const r = await retornar().expect(200);
    assert.equal(r.body.dataSistema, hoje.toISOString());
    assert.equal(r.body.reversao.jurosEstimados, false);
    assert.ok(r.body.reversao.transacoesRemovidas >= 3);
    assert.deepEqual(await saldos(), iniciais);
    const caixa = await Caixinha.findById(caixinhaId).lean();
    assert.equal(caixa.saldoCentavos, 50000);
    assert.equal(caixa.rendimentoPendente, 17.25);
    assert.equal(caixa.metaAtingidaEm, undefined);
    assert.equal(await Transacao.countDocuments({ data: { $gt: hoje } }), 0);
    assert.equal(await Notificacao.countDocuments(), notificacoesIniciais);
    assert.equal(await DiaSimulado.countDocuments(), 0);
    assert.equal((await Recorrencia.findOne().lean()).ultimaExecucao, undefined);
    assert.ok(await BackupReversao.exists({ reversaoId: r.body.reversao.backupId, tipo: 'transacao' }));
    const segundo = await tempoService.avancar({ ate: '2026-02-06' });
    assert.deepEqual(segundo, primeiro);
  });

  test('o novo histórico restaura juros anteriores mesmo após mudar as taxas', async (t) => {
    await tempoService.avancar({ meses: 1 });
    await relogioService.atualizarTaxas({ indicePointsAnual: 99, percentualCaixinha: 200 });
    guardarHoje(t);
    const r = await retornar().expect(200);
    assert.equal(r.body.reversao.jurosEstimados, false);
    assert.equal((await Caixinha.findById(caixinhaId).lean()).rendimentoPendente, 17.25);
  });

  test('preserva os rendimentos e a meta atingida no próprio dia atual do servidor', async (t) => {
    await tempoService.avancar({ ate: '2026-02-06' });
    const referencia = await DiaSimulado.findById(new Date('2026-02-02T00:00:00Z')).lean();
    const caixaAntes = referencia.caixinhas.find((c) => String(c._id) === caixinhaId);
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-02-01T23:59:59Z').getTime() });
    const r = await retornar().expect(200);
    assert.equal(r.body.reversao.transacoesRemovidas, 1);
    const caixa = await Caixinha.findById(caixinhaId).lean();
    assert.equal(caixa.saldoCentavos, caixaAntes.saldoCentavos);
    assert.equal(caixa.rendimentoPendente, caixaAntes.rendimentoPendente);
    assert.equal(caixa.metaAtingidaEm.toISOString(), '2026-02-01T00:00:00.000Z');
    assert.equal(await Transacao.countDocuments({ tipo: 'rendimento' }), 1);
    assert.equal((await Recorrencia.findOne().lean()).ultimaExecucao.toISOString(), '2026-01-05T00:00:00.000Z');
  });

  test('corrige o legado após o botão antigo ter voltado somente a data', async (t) => {
    const iniciais = await saldos();
    await tempoService.avancar({ ate: '2026-02-06' });
    await DiaSimulado.deleteMany({});
    await relogioService.definirData(hoje);
    await assert.rejects(tempoService.avancar({ dias: 1 }), (erro) => erro.codigo === 'efeitos_futuros_pendentes');
    guardarHoje(t);
    const r = await retornar().expect(200);
    assert.equal(r.body.reversao.jurosEstimados, true);
    assert.deepEqual(await saldos(), iniciais);
    const caixa = await Caixinha.findById(caixinhaId).lean();
    assert.equal(caixa.saldoCentavos, 50000);
    assert.ok(Math.abs(caixa.rendimentoPendente - 17.25) < 0.000001);
    const segunda = await retornar().expect(200);
    assert.equal(segunda.body.reversao.transacoesRemovidas, 0);
    assert.equal(segunda.body.reversao.jurosEstimados, false);
    assert.ok(Math.abs((await Caixinha.findById(caixinhaId).lean()).rendimentoPendente - 17.25) < 0.000001);
  });

  test('reverte também movimentações manuais feitas na data futura', async (t) => {
    const iniciais = await saldos();
    await tempoService.avancar({ meses: 1 });
    await ana.agente.post(`/api/caixinhas/${caixinhaId}/resgatar`).send({ valorCentavos: 2000 }).expect(200);
    await ana.agente.post(`/api/caixinhas/${caixinhaId}/aplicar`).send({ valorCentavos: 1000 }).expect(200);
    await ana.agente.post('/api/transferencias').send({ chave: bruno.dados.email, valorCentavos: 1000 }).expect(201);
    guardarHoje(t);
    await retornar().expect(200);
    assert.deepEqual(await saldos(), iniciais);
    assert.equal((await Caixinha.findById(caixinhaId).lean()).saldoCentavos, 50000);
  });

  test('recria caixinha excluída quando há um histórico anterior à exclusão', async (t) => {
    const iniciais = await saldos();
    await tempoService.avancar({ meses: 1 });
    await ana.agente.delete(`/api/caixinhas/${caixinhaId}`).expect(204);
    guardarHoje(t);
    await retornar().expect(200);
    assert.deepEqual(await saldos(), iniciais);
    const caixa = await Caixinha.findById(caixinhaId).lean();
    assert.equal(caixa.nome, 'Reserva');
    assert.equal(caixa.metaCentavos, 50010);
    assert.equal(caixa.saldoCentavos, 50000);
  });

  test('saldo incompatível aborta a transação inteira', async (t) => {
    await tempoService.avancar({ meses: 1 });
    await User.updateOne({ _id: bruno.id }, { $set: { saldoCentavos: 0 } });
    const antes = await estado();
    guardarHoje(t);
    const r = await retornar().expect(409);
    assert.equal(r.body.codigo, 'reversao_inconsistente');
    assert.deepEqual(await estado(), antes);
  });

  test('falha depois das exclusões reverte tudo e permite tentar novamente', async (t) => {
    await tempoService.avancar({ meses: 1 });
    const antes = await estado();
    const falhar = t.mock.method(BackupReversao, 'create', async () => {
      throw new Error('Falha de teste');
    });
    guardarHoje(t);
    await retornar().expect(500);
    assert.deepEqual(await estado(), antes);
    falhar.mock.restore();
    await retornar().expect(200);
  });

  test('bloqueia alterações enquanto outra instância faz manutenção e mantém as leituras disponíveis', async () => {
    await bloqueioSistema.exclusivo(async () => {
      const r = await ana.agente.post('/api/caixinhas').send({ nome: 'Concorrente' }).expect(409);
      assert.equal(r.body.codigo, 'sistema_ocupado');
      await ana.agente.get('/api/conta').expect(200);
    });
    await ana.agente.post('/api/caixinhas').send({ nome: 'Disponível' }).expect(201);
  });
});
