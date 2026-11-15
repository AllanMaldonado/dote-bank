const { z } = require('zod');
const { paginacaoQuery } = require('./comum');

const listarSchema = z.object({
  query: paginacaoQuery.extend({ naoLidas: z.enum(['true', 'false']).optional() }),
});

module.exports = { listarSchema };
