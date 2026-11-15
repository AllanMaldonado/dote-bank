const { z } = require('zod');
const { categoriaOpcional, centavos, chavePix, texto } = require('./comum');

const descricaoOpcional = z.preprocess((v) => (v === '' ? undefined : v), texto('descricao', { max: 140 }).optional());

const destinatarioSchema = z.object({
  query: z.object({ chave: chavePix }),
});

const transferirSchema = z.object({
  body: z.object({
    chave: chavePix,
    valorCentavos: centavos,
    categoria: categoriaOpcional,
    descricao: descricaoOpcional,
  }),
});

module.exports = { destinatarioSchema, transferirSchema };
