const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { app, criarAdmin, criarClienteAtivo, dadosCliente, encerrarBanco, iniciarBanco, request } = require('./helpers');

describe('administração', () => {
  let admin, ana;
  before(async () => {
    await iniciarBanco();
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
  });
  after(encerrarBanco);

  test('busca aceita caracteres especiais e nunca devolve hash', async () => {
    const r = await admin.get('/api/admin/clientes').query({ busca: 'ana (' }).expect(200);
    assert.equal(r.body.total, 0);
    const ok = await admin.get('/api/admin/clientes').query({ busca: 'souza' }).expect(200);
    assert.equal(ok.body.total, 1);
    assert.equal(JSON.stringify(ok.body).includes('"senha"'), false);
    assert.equal(JSON.stringify(ok.body).includes('senhaHash'), false);
    await admin.get('/api/admin/clientes?status=xyz').expect(400);
    await admin.get('/api/admin/clientes?limite=1000').expect(400);
  });

  test('rejeitar e excluir só contas que nunca operaram', async () => {
    const d = dadosCliente('Zé Pendente');
    const cad = await request(app).post('/api/auth/register').send(d).expect(201);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/rejeitar`).expect(200);
    await request(app).post('/api/auth/login').send({ email: d.email, senha: d.senha }).expect(403);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(422);
    await admin.delete(`/api/admin/clientes/${cad.body.user.id}`).expect(204);
    await admin.get(`/api/admin/clientes/${cad.body.user.id}`).expect(404);

    await admin.delete(`/api/admin/clientes/${ana.id}`).expect(422);
  });

  test('admin edita cadastro e taxas', async () => {
    const r = await admin
      .put(`/api/admin/clientes/${ana.id}`)
      .send({ nome: 'Ana S.', celular: '18991234567' })
      .expect(200);
    assert.equal(r.body.nome, 'Ana S.');
    await admin.put(`/api/admin/clientes/${ana.id}`).send({ email: 'invalido' }).expect(400);

    const cfg = await admin.get('/api/admin/config').expect(200);
    assert.equal(cfg.body.percentualCaixinha, 105);
    assert.equal(cfg.body.taxaCaixinhaAnual, (cfg.body.indicePointsAnual * 105) / 100);
    assert.equal(cfg.body.taxaContaAnual, undefined);  
    const novo = await admin
      .put('/api/admin/config/taxas')
      .send({ indicePointsAnual: 10, percentualCaixinha: 150 })
      .expect(200);
    assert.equal(novo.body.taxaCaixinhaAnual, 15);  
    await admin.put('/api/admin/config/taxas').send({ percentualCaixinha: -1 }).expect(400);
    await admin.put('/api/admin/config/taxas').send({ indicePointsAnual: 101 }).expect(400);

    await ana.agente.put('/api/admin/config/taxas').send({ indicePointsAnual: 50 }).expect(403);
  });

  test('painel do admin: clientes por status, saldo, Pix e últimos 6 meses', async () => {
    const r = await admin.get('/api/admin/painel').expect(200);
    assert.equal(
      r.body.clientes.total,
      r.body.clientes.pendente + r.body.clientes.ativo + r.body.clientes.bloqueado + r.body.clientes.rejeitado,
    );
    assert.ok(r.body.clientes.ativo >= 1);
    assert.ok(r.body.saldoTotalCentavos >= 100000);
    assert.equal(r.body.caixinhasCentavos, 0);
    assert.deepEqual(Object.keys(r.body.pix), ['quantidade', 'volumeCentavos']);
    assert.equal(r.body.porMes.length, 6);
    assert.match(r.body.porMes[5].mes, /^\d{4}-\d{2}$/);
    assert.ok(r.body.dataSistema);

    await ana.agente.get('/api/admin/painel').expect(403);
  });

  test('erros comuns viram JSON claro', async () => {
    const r = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ruim')
      .expect(400);
    assert.equal(r.body.codigo, 'json_invalido');
    assert.equal(typeof r.body.message, 'string');
    const id = await admin.get('/api/admin/clientes/123').expect(400);
    assert.equal(id.body.codigo, 'id_invalido');
  });
});
