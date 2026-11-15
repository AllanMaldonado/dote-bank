const assert = require('node:assert/strict');
const { beforeEach, afterEach, test } = require('node:test');
const mongoose = require('mongoose');
const { randomBytes } = require('node:crypto');
const config = {
  isTest: true,
  isProd: false,
  isDev: false,
  naVercel: false,
  jwtSecret: 'segredo-exclusivo-dos-testes',
  jwtExpiresIn: '8h',
  mongoUri: '',
  gemini: { apiKey: '', modelos: [] },
  smtp: {},
};

require.cache[require.resolve('../src/config/env')] = { exports: config } as NodeModule;
const { seedInicial } = require('../scripts/seedInicial');
const User = require('../src/models/User');
const Transacao = require('../src/models/Transacao');
const Caixinha = require('../src/models/Caixinha');
let dbName;

beforeEach(() => {
  dbName = 'dote_seed_test_' + randomBytes(8).toString('hex');
  config.mongoUri = 'mongodb://127.0.0.1:27018/' + dbName;
  process.env.DOTE_ADMIN_NOME = 'Admin de teste';
  process.env.DOTE_ADMIN_EMAIL = 'admin@teste.dev';
  process.env.DOTE_ADMIN_CPF = '00000000191';
  process.env.DOTE_ADMIN_SENHA = 'senha-admin-teste';
  process.env.SEED_DEMO_SENHA = 'senha-clientes-teste';
});
afterEach(async () => {
  await mongoose.connect(config.mongoUri);
  if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test(
  'cenário completo usa credenciais fornecidas e repetir preserva os dados',
  { timeout: 60000 },
  async () => {
    await seedInicial();
    await mongoose.connect(config.mongoUri);
    assert.equal(await User.countDocuments(), 3);
    assert.equal(await Caixinha.countDocuments(), 7);
    const total = await Transacao.countDocuments();
    assert.ok(total > 20);
    const cliente = await User.findOne({ email: 'allan@dote.com' }).select('+senha');
    assert.equal(await cliente.comparePassword('senha-clientes-teste'), true);
    const saldo = cliente.saldoCentavos;
    await mongoose.disconnect();
    await seedInicial();
    await mongoose.connect(config.mongoUri);
    assert.equal(await Transacao.countDocuments(), total);
    assert.equal((await User.findById(cliente._id)).saldoCentavos, saldo);
  },
);

test('banco com usuários é preservado', async () => {
  await mongoose.connect(config.mongoUri);
  await User.create({
    nome: 'Conta existente',
    email: 'existente@teste.dev',
    cpf: '52998224725',
    senha: 'senha-existente',
  });
  await mongoose.disconnect();
  await assert.rejects(seedInicial(), /exige banco vazio/);
  await mongoose.connect(config.mongoUri);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(await Transacao.countDocuments(), 0);
});

test('interrupção é registrada e nova chamada não duplica operações', async (t) => {
  t.mock.method(Caixinha, 'create', async () => {
    throw new Error('falha simulada');
  });
  await assert.rejects(seedInicial(), /falha simulada/);
  await mongoose.connect(config.mongoUri);
  const total = await Transacao.countDocuments();
  const inicializacao = await mongoose.connection.db.collection('inicializacoes').findOne({});
  assert.equal(inicializacao.status, 'interrompido');
  await mongoose.disconnect();
  await assert.rejects(seedInicial(), /em andamento ou interrompida/);
  await mongoose.connect(config.mongoUri);
  assert.equal(await Transacao.countDocuments(), total);
});
