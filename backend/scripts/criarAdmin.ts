import { z } from 'zod';

const { conectarBanco, desconectarBanco } = require('../src/config/database');
const { nome, email, cpf, senha } = require('../src/validators/comum');
const User = require('../src/models/User');
const authService = require('../src/services/authService');

const dadosAdmin = z.object({ nome, email, cpf, senha });

async function criarAdmin() {
  const dados = dadosAdmin.safeParse({
    nome: process.env.DOTE_ADMIN_NOME,
    email: process.env.DOTE_ADMIN_EMAIL,
    cpf: process.env.DOTE_ADMIN_CPF,
    senha: process.env.DOTE_ADMIN_SENHA,
  });
  if (!dados.success) throw new Error('Preencha DOTE_ADMIN_NOME, DOTE_ADMIN_EMAIL, DOTE_ADMIN_CPF e DOTE_ADMIN_SENHA.');

  await conectarBanco();
  try {
    if (await User.exists({ perfil: 'admin' })) throw new Error('Já existe um administrador no DOTE.');
    await authService.criarAdmin(dados.data);
    console.log('Administrador criado.');
  } finally {
    await desconectarBanco();
  }
}

criarAdmin().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : 'Falha ao criar administrador.');
  process.exitCode = 1;
});
