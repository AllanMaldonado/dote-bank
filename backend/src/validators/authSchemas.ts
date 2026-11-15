const { z } = require('zod');
const { celular, cpf, email, nome, senha } = require('./comum');

const registerSchema = z.object({
  body: z.object({ nome, email, cpf, celular: celular.optional(), senha }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ error: 'Informe e-mail e senha' }).trim().toLowerCase().min(1, 'Informe e-mail e senha'),
    senha: z.string({ error: 'Informe e-mail e senha' }).min(1, 'Informe e-mail e senha'),
  }),
});

const forgotPasswordSchema = z.object({ body: z.object({ email }) });

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ error: 'Token ausente' }).min(1, 'Token ausente'),
    novaSenha: senha,
  }),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
