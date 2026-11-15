const { z } = require('zod');
const { categoriaOpcional, centavos, chaveTransferência, texto } = require('./comum');

const descricaoOpcional = z.preprocess((v) => (v === '' ? undefined : v), texto('descricao', { max: 140 }).optional());

const destinatarioSchema = z.object({
  query: z.object({ chave: chaveTransferência }),
});

const transferirSchema = z.object({
  body: z.object({
    chave: chaveTransferência,
    valorCentavos: centavos,
    categoria: categoriaOpcional,
    descricao: descricaoOpcional,
  }),
});

module.exports = { destinatarioSchema, transferirSchema };
