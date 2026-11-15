const { z } = require('zod');
const { chaveTransferência, texto } = require('./comum');

const apelido = texto('apelido', { min: 1, max: 40 });
const criarContatoSchema = z.object({ body: z.object({ apelido, chave: chaveTransferência }) });
const atualizarContatoSchema = z.object({
  body: z.object({ apelido: apelido.optional(), chave: chaveTransferência.optional() }),
});

module.exports = { criarContatoSchema, atualizarContatoSchema };
