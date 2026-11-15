const { z } = require('zod');
const { dataIso } = require('./comum');

const avancarRelogioSchema = z.object({
  body: z
    .object({
      dias: z.number({ error: 'dias deve ser um inteiro entre 1 e 400' }).int().min(1).max(400).optional(),
      meses: z.number({ error: 'meses deve ser um inteiro entre 1 e 12' }).int().min(1).max(12).optional(),
      ate: dataIso.optional(),
    })
    .refine((b) => [b.dias, b.meses, b.ate].filter((v) => v !== undefined).length === 1, {
      message: 'Informe apenas um: dias, meses ou ate',
    }),
});

module.exports = { avancarRelogioSchema };
