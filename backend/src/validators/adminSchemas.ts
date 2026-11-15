const { z } = require('zod');
const { STATUS } = require('../models/constantes');
const { email, celular, nome, paginacaoQuery } = require('./comum');

const listarClientesSchema = z.object({
  query: paginacaoQuery.extend({
    status: z.enum(STATUS, { error: `status inválido. Use: ${STATUS.join(', ')}` }).optional(),
    busca: z.string().trim().optional(),
  }),
});

const atualizarClienteSchema = z.object({
  body: z.object({ nome: nome.optional(), email: email.optional(), celular: celular.optional() }),
});

const percentual = (campo, max) =>
  z
    .number({ error: `${campo} deve ser um número entre 0 e ${max}` })
    .min(0, `${campo} deve ser um número entre 0 e ${max}`)
    .max(max, `${campo} deve ser um número entre 0 e ${max}`)
    .optional();

const atualizarTaxasSchema = z.object({
  body: z.object({
    indicePointsAnual: percentual('indicePointsAnual', 100),
    percentualCaixinha: percentual('percentualCaixinha', 500),
  }),
});

module.exports = { listarClientesSchema, atualizarClienteSchema, atualizarTaxasSchema };
