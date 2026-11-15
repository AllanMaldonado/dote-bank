import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const { conectarBanco, desconectarBanco, resetarBanco } = require('../src/config/database');
const authService = require('../src/services/authService');
const emailService = require('../src/services/emailService');

const URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27018';
const bancoDeTeste = 'dote_test_' + process.pid + '_' + randomBytes(4).toString('hex');

const caixa = [];
emailService.definirTransporte({ sendMail: async (msg) => caixa.push(msg) });

const ultimoLinkReset = () => caixa.at(-1)?.text.match(/https?:\/\/\S+/)?.[0];

async function iniciarBanco() {
  await conectarBanco(URI, bancoDeTeste);
  await resetarBanco();
}

async function encerrarBanco() {
  try {
    if (mongoose.connection.name === bancoDeTeste) await mongoose.connection.dropDatabase();
  } finally {
    await desconectarBanco();
  }
}

const CPFS = ['52998224725', '11144477735', '39053344705', '15350946056', '86288366757', '70548445052'];
let proximoCpf = 0;

function dadosCliente(nome, extra = {}) {
  const slug = nome.toLowerCase().replace(/\W+/g, '');
  return {
    nome,
    email: `${slug}@teste.dote.com`,
    cpf: CPFS[proximoCpf++ % CPFS.length],
    celular: `1899${String(1000000 + proximoCpf).slice(-7)}`,
    senha: 'segredo123',
    ...extra,
  };
}

function agenteComToken(token) {
  const agente = { token };
  for (const metodo of ['get', 'post', 'put', 'patch', 'delete']) {
    agente[metodo] = (url) => request(app)[metodo](url).set('Authorization', `Bearer ${token}`);
  }
  return agente;
}

async function logar({ email, senha }) {
  const r = await request(app).post('/api/auth/login').send({ email, senha }).expect(200);
  return agenteComToken(r.body.token);
}

async function criarAdmin() {
  const credenciais = { email: 'admin@teste.dev', senha: 'admin123' };
  await authService.criarAdmin({ nome: 'Admin', cpf: '00000000191', ...credenciais });
  return logar(credenciais);
}

async function criarClienteAtivo(admin, nome) {
  const dados = dadosCliente(nome);
  const r = await request(app).post('/api/auth/register').send(dados).expect(201);
  await admin.patch(`/api/admin/clientes/${r.body.user.id}/aprovar`).expect(200);
  return { agente: await logar(dados), id: r.body.user.id, dados };
}

module.exports = {
  app,
  request,
  ultimoLinkReset,
  iniciarBanco,
  encerrarBanco,
  dadosCliente,
  agenteComToken,
  logar,
  criarAdmin,
  criarClienteAtivo,
};
