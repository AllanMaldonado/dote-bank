const { z } = require('zod');
const { centavos, texto } = require('./comum');

const nome = texto('nome', { min: 1, max: 40 });

const criarCaixinhaSchema = z.object({
  body: z.object({ nome, metaCentavos: centavos.nullish() }),
});

const atualizarCaixinhaSchema = z.object({
  body: z.object({ nome: nome.optional(), metaCentavos: centavos.nullish() }),
});

const valorCaixinhaSchema = z.object({
  body: z.object({ valorCentavos: centavos }),
});

module.exports = {
  criarCaixinhaSchema,
  atualizarCaixinhaSchema,
  valorCaixinhaSchema,
};
