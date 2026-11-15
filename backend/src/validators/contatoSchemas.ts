const { z } = require('zod');
const { chavePix, texto } = require('./comum');

const apelido = texto('apelido', { min: 1, max: 40 });
const criarContatoSchema = z.object({ body: z.object({ apelido, chave: chavePix }) });
const atualizarContatoSchema = z.object({
  body: z.object({ apelido: apelido.optional(), chave: chavePix.optional() }),
});

module.exports = { criarContatoSchema, atualizarContatoSchema };
