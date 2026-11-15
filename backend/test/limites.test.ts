const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const mongoose = require('mongoose');
const { randomBytes } = require('node:crypto');

require.cache[require.resolve('../src/config/env')] = {
  exports: {
    isTest: false,
    naVercel: false,
    frontendUrl: 'http://localhost:5173',
    jwtSecret: 'teste',
    gemini: { apiKey: '', modelos: [] },
    smtp: {},
  },
} as NodeModule;
const database = require('../src/config/database');
const LimiteStore = require('../src/services/limiteStore');
const { rateLimit } = require('express-rate-limit');
const express = require('express');
const request = require('supertest');
const dbName = 'dote_limites_test_' + randomBytes(8).toString('hex');

before(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27018', { dbName, serverSelectionTimeoutMS: 5000 });
  database.garantirBanco = async () => mongoose.connection;
});
after(async () => {
  if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('instâncias compartilham incrementos atômicos e chaves armazenadas como hash', async () => {
  const a = new LimiteStore('compartilhado'),
    b = new LimiteStore('compartilhado');
  const respostas = await Promise.all(
    Array.from({ length: 40 }, (_, i) => (i % 2 ? a : b).increment('127.0.0.1')),
  );
  assert.deepEqual(
    respostas.map((r) => r.totalHits).sort((a, b) => a - b),
    Array.from({ length: 40 }, (_, i) => i + 1),
  );
  const salvo = await mongoose.connection.db
    .collection('limites_requisicoes')
    .findOne({ _id: a.chave('127.0.0.1') });
  assert.equal(salvo.totalHits, 40);
  assert.equal(salvo._id.includes('127.0.0.1'), false);
  const indices = await mongoose.connection.db.collection('limites_requisicoes').indexes();
  assert.ok(indices.some((i) => i.key.resetTime === 1 && i.expireAfterSeconds === 0));
});

test('janela vencida reinicia o contador mesmo antes da limpeza TTL', async () => {
  const store = new LimiteStore('expiracao');
  await store.increment('cliente');
  await mongoose.connection.db
    .collection('limites_requisicoes')
    .updateOne({ _id: store.chave('cliente') }, { $set: { resetTime: new Date(0) } });
  const atual = await store.increment('cliente');
  assert.equal(atual.totalHits, 1);
  assert.ok(atual.resetTime > new Date());
});

test('cotas distintas não compartilham contadores', async () => {
  const a = new LimiteStore('rota-a'),
    b = new LimiteStore('rota-b');
  await a.increment('cliente');
  assert.equal((await a.increment('cliente')).totalHits, 2);
  assert.equal((await b.increment('cliente')).totalHits, 1);
});

test('excesso retorna 429 e Retry-After entre instâncias Express', async () => {
  const app = express();
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 2,
      store: new LimiteStore('http'),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
  app.get('/', (req, res) => res.json({ ok: true }));
  await request(app).get('/').expect(200);
  await request(app).get('/').expect(200);
  const r = await request(app).get('/').expect(429);
  assert.ok(Number(r.headers['retry-after']) > 0);
  assert.ok(r.headers.ratelimit);
});

test('falha no contador impede requisição de prosseguir', async (t) => {
  const store = new LimiteStore('indisponivel');
  t.mock.method(store, 'increment', async () => {
    throw new Error('indisponível');
  });
  const app = express();
  app.use(rateLimit({ limit: 2, store, passOnStoreError: false }));
  app.get('/', () => assert.fail('a rota não deve executar'));
  app.use((erro, req, res, next) => res.status(503).end());
  await request(app).get('/').expect(503);
});
