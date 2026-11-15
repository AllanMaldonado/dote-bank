const { z } = require('zod');
const { CATEGORIAS } = require('../models/constantes');
const { cpfValido, somenteDigitos } = require('../utils/validacao');

const obrigatorio = (campo) => ({ error: `${campo} é obrigatório` });

const nome = z
  .string(obrigatorio('nome'))
  .trim()
  .min(2, 'nome deve ter entre 2 e 80 caracteres')
  .max(80, 'nome deve ter entre 2 e 80 caracteres');

const email = z.string(obrigatorio('e-mail')).trim().toLowerCase().pipe(z.email('E-mail inválido'));

const cpf = z.string(obrigatorio('CPF')).transform(somenteDigitos).refine(cpfValido, 'CPF inválido');

const celular = z
  .string(obrigatorio('celular'))
  .transform(somenteDigitos)
  .refine((v) => /^[1-9]{2}9\d{8}$/.test(v), 'Celular inválido (DDD + 9 dígitos)');

const senha = z
  .string(obrigatorio('senha'))
  .min(8, 'A senha deve ter entre 8 e 72 caracteres')
  .max(72, 'A senha deve ter entre 8 e 72 caracteres');

const centavos = z
  .number({ error: 'valorCentavos deve ser um inteiro positivo (centavos)' })
  .int('valorCentavos deve ser um inteiro positivo (centavos)')
  .positive('valorCentavos deve ser um inteiro positivo (centavos)')
  .max(100_000_000_00, 'valorCentavos excede o limite');

const categoria = z.enum(CATEGORIAS, { error: `categoria inválida. Use: ${CATEGORIAS.join(', ')}` });
const chaveTransferência = z
  .string({ error: 'Informe a chave de transferência' })
  .trim()
  .min(1, 'Informe a chave de transferência');

const categoriaOpcional = z.preprocess(
  (v) => (v === undefined || v === null || v === '' ? 'Outros' : v),
  categoria,
);

const texto = (campo, { min = 1, max = 120 } = {}) =>
  z
    .string(obrigatorio(campo))
    .trim()
    .min(min, `${campo} deve ter entre ${min} e ${max} caracteres`)
    .max(max, `${campo} deve ter entre ${min} e ${max} caracteres`);

const dataIso = z
  .string({ error: 'Data deve estar no formato AAAA-MM-DD' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'Data inválida')
  .transform((v) => new Date(`${v}T00:00:00.000Z`));

const paginacaoQuery = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  nome,
  email,
  cpf,
  celular,
  senha,
  centavos,
  categoria,
  categoriaOpcional,
  chaveTransferência,
  texto,
  dataIso,
  paginacaoQuery,
};
