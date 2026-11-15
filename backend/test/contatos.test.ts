const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const { criarAdmin, criarClienteAtivo, encerrarBanco, iniciarBanco } = require('./helpers');
const Contato = require('../src/models/Contato');
const relogioService = require('../src/services/relogioService');

describe('contatos', () => {
  let admin, ana, bruno, carla;
  before(async () => {
    await iniciarBanco();
    await relogioService.definirData(new Date('2026-05-10T00:00:00Z'));
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana Souza');
    bruno = await criarClienteAtivo(admin, 'Bruno Lima');
    carla = await criarClienteAtivo(admin, 'Carla Dias');
    for (const c of [ana, bruno, carla]) await c.agente.post('/api/pix/chaves').send({ tipo: 'email' }).expect(201);
  });
  after(encerrarBanco);

  test('contatos: CRUD, validações e regras da chave', async () => {
    const a = ana.agente;
    const c = await a.post('/api/contatos').send({ apelido: 'Bruninho', chave: bruno.dados.email }).expect(201);
    assert.equal(c.body.apelido, 'Bruninho');
    assert.equal(c.body.chave, bruno.dados.email);
    assert.equal(c.body.destinatario, 'Bruno Lima');
    assert.ok(c.body.id && c.body.criadoEm);

    const dup = await a.post('/api/contatos').send({ apelido: 'Outro', chave: bruno.dados.email }).expect(409);
    assert.equal(dup.body.codigo, 'contato_duplicado');
    const inexistente = await a.post('/api/contatos').send({ apelido: 'X', chave: 'ninguem@x.dev' }).expect(404);
    assert.equal(inexistente.body.codigo, 'chave_nao_encontrada');
    const propria = await a.post('/api/contatos').send({ apelido: 'Eu', chave: ana.dados.email }).expect(422);
    assert.equal(propria.body.codigo, 'pix_para_si');
    await a.post('/api/contatos').send({ apelido: '', chave: carla.dados.email }).expect(400);
    await a
      .post('/api/contatos')
      .send({ apelido: 'a'.repeat(41), chave: carla.dados.email })
      .expect(400);
    await a.post('/api/contatos').send({ apelido: 'Sem chave' }).expect(400);

    for (const metodo of ['get', 'put', 'delete']) {
      const invalido = await a[metodo]('/api/contatos/id-invalido').expect(400);
      assert.equal(invalido.body.codigo, 'id_invalido');
    }

    const carlaContato = await a
      .post('/api/contatos')
      .send({ apelido: 'Carlinha', chave: carla.dados.email })
      .expect(201);
    const lista = await a.get('/api/contatos').expect(200);
    assert.deepEqual(
      lista.body.itens.map((i) => i.apelido),
      ['Bruninho', 'Carlinha'],
    );
    assert.equal((await a.get(`/api/contatos/${c.body.id}`).expect(200)).body.apelido, 'Bruninho');

    const ed = await a.put(`/api/contatos/${c.body.id}`).send({ apelido: 'Irmão' }).expect(200);
    assert.equal(ed.body.apelido, 'Irmão');
    assert.equal(ed.body.chave, bruno.dados.email);
    await a.put(`/api/contatos/${c.body.id}`).send({ chave: carla.dados.email }).expect(409);
    await a.put(`/api/contatos/${c.body.id}`).send({ chave: 'ninguem@x.dev' }).expect(404);

    await bruno.agente.get(`/api/contatos/${c.body.id}`).expect(404);
    await bruno.agente.put(`/api/contatos/${c.body.id}`).send({ apelido: 'Hack' }).expect(404);
    await bruno.agente.delete(`/api/contatos/${c.body.id}`).expect(404);
    assert.equal((await bruno.agente.get('/api/contatos').expect(200)).body.itens.length, 0);
    await a.get('/api/contatos/nao-e-id').expect(400);
    await admin.get('/api/contatos').expect(403);

    await a.delete(`/api/contatos/${carlaContato.body.id}`).expect(204);
    await a.delete(`/api/contatos/${carlaContato.body.id}`).expect(404);
    assert.equal((await a.get('/api/contatos').expect(200)).body.itens.length, 1);
  });

  test('contatos: limite de 50 por cliente', async () => {
    const docs = Array.from({ length: 49 }, (_, i) => ({
      usuarioId: ana.id,
      apelido: `Contato ${i}`,
      chaveDestino: `chave-${i}@x.dev`,
      destinatarioNome: 'Alguém',
    }));
    await Contato.insertMany(docs);  
    const r = await ana.agente
      .post('/api/contatos')
      .send({ apelido: 'Carlinha', chave: carla.dados.email })
      .expect(422);
    assert.equal(r.body.codigo, 'limite_contatos');
    await Contato.deleteMany({ usuarioId: ana.id });
  });

  test('as rotas removidas de orçamentos devolvem 404', async () => {
    await ana.agente.get('/api/orcamentos').expect(404);
    await ana.agente.post('/api/orcamentos').send({ categoria: 'Lazer', limiteCentavos: 10000 }).expect(404);
  });
});
