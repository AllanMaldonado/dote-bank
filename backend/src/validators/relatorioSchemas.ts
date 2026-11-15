const { z } = require('zod');
const { categoria, dataIso } = require('./comum');

const periodo = z.object({ inicio: dataIso.optional(), fim: dataIso.optional(), categoria: categoria.optional() });

const relatorioSchema = z.object({ query: periodo });
const analiseSchema = z.object({ body: periodo });

module.exports = { relatorioSchema, analiseSchema };
