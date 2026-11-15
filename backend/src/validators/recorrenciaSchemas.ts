const { z } = require('zod');
const { categoria, categoriaOpcional, centavos, chaveTransferência, texto } = require('./comum');

const diaDoMes = z.coerce.number({ error: 'diaDoMes deve ser um inteiro entre 1 e 28' }).int().min(1).max(28);
const descricao = texto('descricao', { max: 140 });

const criarRecorrenciaSchema = z.object({
  body: z.object({ chave: chaveTransferência, valorCentavos: centavos, diaDoMes, categoria: categoriaOpcional, descricao }),
});

const atualizarRecorrenciaSchema = z.object({
  body: z.object({
    chave: chaveTransferência.optional(),
    valorCentavos: centavos.optional(),
    diaDoMes: diaDoMes.optional(),
    categoria: categoria.optional(),
    descricao: descricao.optional(),
    ativa: z.boolean().optional(),
  }),
});

const definirAtivaSchema = z.object({
  body: z.object({ ativa: z.boolean({ error: 'ativa deve ser true ou false' }) }),
});

module.exports = {
  criarRecorrenciaSchema,
  atualizarRecorrenciaSchema,
  definirAtivaSchema,
};
