const { z } = require('zod');
const { celular, nome, senha } = require('./comum');

const atualizarPerfilSchema = z.object({
  body: z.object({ nome: nome.optional(), celular: celular.optional() }),
});

const trocarSenhaSchema = z.object({
  body: z.object({
    senhaAtual: z.string({ error: 'Informe a senha atual' }).min(1, 'Informe a senha atual'),
    novaSenha: senha,
  }),
});

module.exports = { atualizarPerfilSchema, trocarSenhaSchema };
