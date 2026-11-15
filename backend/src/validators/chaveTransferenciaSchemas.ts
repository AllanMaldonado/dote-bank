const { z } = require('zod');
const { TIPOS_CHAVE } = require('../models/constantes');

const criarChaveSchema = z.object({
  body: z.object({ tipo: z.enum(TIPOS_CHAVE, { error: `tipo inválido. Use: ${TIPOS_CHAVE.join(', ')}` }) }),
});

module.exports = { criarChaveSchema };
