const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco } = require('./helpers');
const recorrenciaService = require('../src/services/recorrenciaService');

describe('caixinhas e Transferência recorrente', () => {
  let admin, ana, bruno;
  before(async () => {
    await iniciarBanco();
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    await bruno.agente.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);
  });
  after(encerrarBanco);

  test('caixinha: criar, aplicar até a meta, resgatar, editar e excluir devolvendo o saldo', async () => {
    const a = ana.agente;
    const c = await a.post('/api/caixinhas').send({ nome: 'Notebook', metaCentavos: 35000 }).expect(201);
    assert.equal(c.body.saldoCentavos, 0);
    assert.equal(c.body.progresso, 0);
    await a.post('/api/caixinhas').send({ nome: '' }).expect(400);

    const ap = await a.post(`/api/caixinhas/${c.body.id}/aplicar`).send({ valorCentavos: 20000 }).expect(200);
    assert.equal(ap.body.progresso, 57);
    assert.equal(ap.body.metaAtingida, false);
    const ap2 = await a.post(`/api/caixinhas/${c.body.id}/aplicar`).send({ valorCentavos: 15000 }).expect(200);
    assert.equal(ap2.body.metaAtingida, true);
    const notifs = await a.get('/api/notificacoes').expect(200);
    assert.ok(notifs.body.itens.some((n) => n.tipo === 'meta_atingida'));

    const conta = await a.get('/api/conta').expect(200);
    assert.equal(conta.body.saldoCentavos, 100000 - 35000);
    assert.equal(conta.body.caixinhasCentavos, 35000);

    await a.post(`/api/caixinhas/${c.body.id}/aplicar`).send({ valorCentavos: 99_000_000 }).expect(422);
    await a.post(`/api/caixinhas/${c.body.id}/resgatar`).send({ valorCentavos: 99_000_000 }).expect(422);
    const rg = await a.post(`/api/caixinhas/${c.body.id}/resgatar`).send({ valorCentavos: 5000 }).expect(200);
    assert.equal(rg.body.saldoCentavos, 30000);

    const ed = await a
      .put(`/api/caixinhas/${c.body.id}`)
      .send({ nome: 'Notebook novo', metaCentavos: 40000 })
      .expect(200);
    assert.equal(ed.body.nome, 'Notebook novo');
    assert.equal(ed.body.metaAtingida, false);

    const cx = await a.get('/api/transacoes?tipo=caixinha').expect(200);
    assert.equal(cx.body.total, 3);
    assert.ok(cx.body.itens.every((t) => t.direcao === 'interno'));
    assert.equal((await a.get('/api/transacoes?tipo=saida')).body.total, 0);

    await bruno.agente.get(`/api/caixinhas/${c.body.id}`).expect(404);
    await a.delete(`/api/caixinhas/${c.body.id}`).expect(204);
    assert.equal((await a.get('/api/conta')).body.saldoCentavos, 100000);
    assert.equal((await a.get('/api/caixinhas')).body.itens.length, 0);
  });

  test('recorrência: CRUD, pausa e validações', async () => {
    const a = ana.agente;
    const r = await a
      .post('/api/transferencias/agendamentos')
      .send({ chave: bruno.dados.email, valorCentavos: 95000, diaDoMes: 5, categoria: 'Moradia', descricao: 'Aluguel' })
      .expect(201);
    assert.equal(r.body.destinatario, 'Bruno Lima');
    assert.equal(r.body.ativa, true);

    await a
      .post('/api/transferencias/agendamentos')
      .send({ chave: bruno.dados.email, valorCentavos: 100, diaDoMes: 31, descricao: 'x' })
      .expect(400);
    await a
      .post('/api/transferencias/agendamentos')
      .send({ chave: 'ninguem@x.dev', valorCentavos: 100, diaDoMes: 1, descricao: 'x' })
      .expect(404);
    await a
      .post('/api/transferencias/agendamentos')
      .send({ chave: bruno.dados.email, valorCentavos: 100, diaDoMes: 1 })
      .expect(400);

    const ed = await a
      .put(`/api/transferencias/agendamentos/${r.body.id}`)
      .send({ valorCentavos: 100000, diaDoMes: 10 })
      .expect(200);
    assert.equal(ed.body.valorCentavos, 100000);
    assert.equal(ed.body.diaDoMes, 10);

    const pausa = await a.patch(`/api/transferencias/agendamentos/${r.body.id}/ativa`).send({ ativa: false }).expect(200);
    assert.equal(pausa.body.ativa, false);
    await a.patch(`/api/transferencias/agendamentos/${r.body.id}/ativa`).send({ ativa: 'sim' }).expect(400);

    assert.equal((await a.get('/api/transferencias/agendamentos')).body.itens.length, 1);
    await bruno.agente.delete(`/api/transferencias/agendamentos/${r.body.id}`).expect(404);
    await a.delete(`/api/transferencias/agendamentos/${r.body.id}`).expect(204);
    await a.get(`/api/transferencias/agendamentos/${r.body.id}`).expect(404);
  });

  test('executarDoDia é reentrante: repetir o mesmo dia não cobra nem registra falha de novo', async () => {
    await ana.agente.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);
    await ana.agente
      .post('/api/transferencias/agendamentos')
      .send({ chave: bruno.dados.email, valorCentavos: 10000, diaDoMes: 5, categoria: 'Contas', descricao: 'Internet' })
      .expect(201);
    await bruno.agente
      .post('/api/transferencias/agendamentos')
      .send({ chave: ana.dados.email, valorCentavos: 90_000_000, diaDoMes: 5, descricao: 'Carro' })
      .expect(201);

    const dia = new Date('2026-03-05T00:00:00Z');
    const saldoAna = async () => (await ana.agente.get('/api/conta').expect(200)).body.saldoCentavos;
    const saldoBruno = async () => (await bruno.agente.get('/api/conta').expect(200)).body.saldoCentavos;
    const antesAna = await saldoAna();
    const antesBruno = await saldoBruno();

    assert.deepEqual(await recorrenciaService.executarDoDia(dia), { executadas: 1, falhas: 1 });
    assert.deepEqual(await recorrenciaService.executarDoDia(dia), { executadas: 0, falhas: 0 });

    assert.equal(await saldoAna(), antesAna - 10000);
    assert.equal(await saldoBruno(), antesBruno + 10000);
    const saidas = await ana.agente.get('/api/transacoes?tipo=saida').expect(200);
    assert.equal(saidas.body.itens.filter((t) => t.tipo === 'recorrencia').length, 1);
    const falhas = await bruno.agente.get('/api/transacoes?tipo=saida').expect(200);
    assert.equal(falhas.body.itens.filter((t) => t.status === 'falhou').length, 1);

    const proximo = await recorrenciaService.executarDoDia(new Date('2026-04-05T00:00:00Z'));
    assert.equal(proximo.executadas, 1);
  });
});
