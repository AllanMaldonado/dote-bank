const { z } = require('zod');
const { CATEGORIAS } = require('../models/constantes');
const { dataIso, paginacaoQuery } = require('./comum');

const TIPOS_EXTRATO = ['entrada', 'saida', 'caixinha'];

const extratoSchema = z.object({
  query: paginacaoQuery
    .extend({
      inicio: dataIso.optional(),
      fim: dataIso.optional(),
      tipo: z.enum(TIPOS_EXTRATO, { error: 'tipo deve ser entrada, saida ou caixinha' }).optional(),
      categoria: z.enum(CATEGORIAS, { error: `categoria inválida. Use: ${CATEGORIAS.join(', ')}` }).optional(),
      busca: z.string().trim().max(80).optional(),
    })
    .refine((q) => !q.inicio || !q.fim || q.inicio <= q.fim, { message: 'inicio deve ser anterior a fim' }),
});

module.exports = { extratoSchema };
