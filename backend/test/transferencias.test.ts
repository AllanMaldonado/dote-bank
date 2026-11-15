const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const Notificacao = require('../src/models/Notificacao');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco } = require('./helpers');

describe('chaves de transferência, Transferência, extrato e comprovante', () => {
  let admin, ana, bruno, carla;
  before(async () => {
    await iniciarBanco();
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    carla = await criarClienteAtivo(admin, 'Carla Dias');
  });
  after(encerrarBanco);

  test('CRUD de chaves: 4 tipos, únicas, limite de 5, só aleatória é editável', async () => {
    const a = ana.agente;
    const cpf = await a.post('/api/transferencias/chaves').send({ tipo: 'cpf' }).expect(201);
    assert.equal(cpf.body.valor, ana.dados.cpf);
    await a.post('/api/transferencias/chaves').send({ tipo: 'cpf' }).expect(409);
    const email = await a.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);
    assert.equal(email.body.valor, ana.dados.email);
    const cel = await a.post('/api/transferencias/chaves').send({ tipo: 'celular' }).expect(201);
    assert.equal(cel.body.valor, `+55${ana.dados.celular}`);
    const al1 = await a.post('/api/transferencias/chaves').send({ tipo: 'aleatoria' }).expect(201);
    await a.post('/api/transferencias/chaves').send({ tipo: 'aleatoria' }).expect(201);
    const limite = await a.post('/api/transferencias/chaves').send({ tipo: 'aleatoria' }).expect(422);
    assert.equal(limite.body.codigo, 'limite_chaves');
    await a.post('/api/transferencias/chaves').send({ tipo: 'telefone' }).expect(400);

    const lista = await a.get('/api/transferencias/chaves').expect(200);
    assert.equal(lista.body.itens.length, 5);

    const nova = await a.put(`/api/transferencias/chaves/${al1.body.id}`).expect(200);
    assert.notEqual(nova.body.valor, al1.body.valor);
    await a.put(`/api/transferencias/chaves/${cpf.body.id}`).expect(422);

    await bruno.agente.get(`/api/transferencias/chaves/${cpf.body.id}`).expect(404);
    await bruno.agente.delete(`/api/transferencias/chaves/${cpf.body.id}`).expect(404);
    await a.get('/api/transferencias/chaves/nao-e-id').expect(400);

    await a.delete(`/api/transferencias/chaves/${al1.body.id}`).expect(204);
    assert.equal((await a.get('/api/transferencias/chaves')).body.itens.length, 4);

    await bruno.agente.post('/api/transferencias/chaves').send({ tipo: 'email' }).expect(201);
  });

  test('preview do destinatário mostra nome e CPF mascarado', async () => {
    const r = await bruno.agente.get('/api/transferencias/destinatario').query({ chave: ana.dados.email }).expect(200);
    assert.equal(r.body.nome, 'Ana Souza');
    assert.match(r.body.cpf, /^\*\*\*\.\d{3}\.\d{3}-\*\*$/);
    assert.equal(r.body.propria, false);
    const fmt = ana.dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    await bruno.agente.get('/api/transferencias/destinatario').query({ chave: fmt }).expect(200);
    await bruno.agente.get('/api/transferencias/destinatario').query({ chave: ana.dados.celular }).expect(200);
    await bruno.agente.get('/api/transferencias/destinatario').query({ chave: 'ninguem@x.dev' }).expect(404);
  });

  let transferenciaId;
  test('Transferência move saldo, gera comprovante e notifica os dois lados', async () => {
    const r = await bruno.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: 12000, categoria: 'Lazer', descricao: 'Cinema' })
      .expect(201);
    transferenciaId = r.body.id;
    assert.equal(r.body.direcao, 'saida');
    assert.equal(r.body.destino.nome, 'Ana Souza');
    assert.match(r.body.codigo, /^DOTE\d{8}[0-9A-F]{10}$/);

    assert.equal((await bruno.agente.get('/api/conta')).body.saldoCentavos, 100000 - 12000);
    assert.equal((await ana.agente.get('/api/conta')).body.saldoCentavos, 100000 + 12000);

    const comprovanteAna = await ana.agente.get(`/api/transacoes/${transferenciaId}`).expect(200);
    assert.equal(comprovanteAna.body.direcao, 'entrada');
    await carla.agente.get(`/api/transacoes/${transferenciaId}`).expect(404);
    await admin.get(`/api/transacoes/${transferenciaId}`).expect(200);

    const notifAna = await ana.agente.get('/api/notificacoes?naoLidas=true').expect(200);
    const recebido = notifAna.body.itens.find((n) => n.tipo === 'transferencia_recebida');
    assert.ok(recebido);
    assert.match(recebido.mensagem, /P\$\s120,00/);
    assert.equal(recebido.link, `/comprovante/${transferenciaId}`);
    await Notificacao.updateOne({ _id: recebido.id }, { mensagem: 'Você recebeu R$ 120,00 de Bruno Lima.' });
    const historico = await ana.agente.get('/api/notificacoes').expect(200);
    assert.equal(
      historico.body.itens.find((n) => n.id === recebido.id).mensagem,
      'Você recebeu P$ 120,00 de Bruno Lima.',
    );
    await ana.agente.patch(`/api/notificacoes/${recebido.id}/lida`).expect(200);
    await bruno.agente.patch(`/api/notificacoes/${recebido.id}/lida`).expect(404);
    await ana.agente.patch('/api/notificacoes/lidas').expect(200);
    assert.equal((await ana.agente.get('/api/notificacoes')).body.naoLidas, 0);
  });

  test('regras da transferência: saldo, para si mesmo, valor e categoria', async () => {
    const insuf = await bruno.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: 99_000_000 })
      .expect(422);
    assert.equal(insuf.body.codigo, 'saldo_insuficiente');
    const si = await ana.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: 100 })
      .expect(422);
    assert.equal(si.body.codigo, 'transferencia_para_si');
    await bruno.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: 10.5 })
      .expect(400);
    await bruno.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: -100 })
      .expect(400);
    await bruno.agente
      .post('/api/transferencias')
      .send({ chave: ana.dados.email, valorCentavos: 100, categoria: 'Cassino' })
      .expect(400);
    assert.equal((await bruno.agente.get('/api/conta')).body.saldoCentavos, 88000);
  });

  test('extrato filtra por tipo e período e pagina', async () => {
    await ana.agente
      .post('/api/transferencias')
      .send({ chave: bruno.dados.email, valorCentavos: 5000, categoria: 'Alimentação' })
      .expect(201);
    const todos = await ana.agente.get('/api/transacoes').expect(200);
    assert.equal(todos.body.total, 3);
    const entradas = await ana.agente.get('/api/transacoes?tipo=entrada').expect(200);
    assert.equal(entradas.body.total, 2);
    assert.ok(entradas.body.itens.every((t) => t.direcao === 'entrada'));
    const saidas = await ana.agente.get('/api/transacoes?tipo=saida').expect(200);
    assert.equal(saidas.body.total, 1);
    assert.equal(saidas.body.itens[0].categoria, 'Alimentação');
    const pag = await ana.agente.get('/api/transacoes?limite=2&pagina=2').expect(200);
    assert.equal(pag.body.itens.length, 1);
    const futuro = await ana.agente.get('/api/transacoes?inicio=2999-01-01').expect(200);
    assert.equal(futuro.body.total, 0);
    await ana.agente.get('/api/transacoes?inicio=01/01/2026').expect(400);
    await ana.agente.get('/api/transacoes?tipo=xyz').expect(400);
  });
});
