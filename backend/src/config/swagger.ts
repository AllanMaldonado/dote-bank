
const { CATEGORIAS, STATUS, TIPOS_CHAVE } = require('../models/constantes');

type Rota = [metodo: string, caminho: string, resumo: string, protegida: boolean];
type Schema = Record<string, unknown>;
type Parametro = { name: string; in: 'path' | 'query'; required: boolean; schema: Schema };
type Operacao = {
  tags: string[];
  summary: string;
  parameters: Parametro[];
  responses: Record<string, { description?: string; $ref?: string; content?: Record<string, { schema: Schema }> }>;
  requestBody?: { required: boolean; content: Record<string, { schema: Schema }> };
  security?: Record<string, string[]>[];
};

const ROTAS: Rota[] = [
  ['get', '/saude', 'Verifica se a API está no ar', false],

  ['post', '/auth/register', 'Cadastro; a conta fica pendente de aprovação e já vem logada', false],
  ['post', '/auth/login', 'Login; devolve token e usuário', false],
  ['get', '/auth/me', 'Usuário da sessão atual', true],
  ['post', '/auth/logout', 'Encerra a sessão (invalida os tokens emitidos)', true],
  ['post', '/auth/forgot-password', 'Envia o link de redefinição (resposta sempre genérica)', false],
  ['post', '/auth/reset-password', 'Redefine a senha com o token recebido por e-mail', false],

  ['get', '/conta', 'Resumo da conta do cliente', true],
  ['patch', '/conta/perfil', 'Atualiza os dados do perfil', true],
  ['put', '/conta/senha', 'Troca a senha e devolve novo token', true],

  ['get', '/pix/destinatario', 'Prévia de quem recebe a chave de transferência', true],
  ['post', '/pix/transferencias', 'Envia uma transferência', true],
  ['get', '/pix/chaves', 'Lista as chaves de transferência do cliente', true],
  ['post', '/pix/chaves', 'Cria uma chave de transferência', true],
  ['get', '/pix/chaves/:id', 'Obtém uma chave de transferência', true],
  ['put', '/pix/chaves/:id', 'Atualiza a chave (regenera o valor aleatório)', true],
  ['delete', '/pix/chaves/:id', 'Exclui uma chave de transferência', true],
  ['get', '/pix/agendamentos', 'Lista os Transferências agendadas (mensais)', true],
  ['post', '/pix/agendamentos', 'Cria um Transferência agendada', true],
  ['get', '/pix/agendamentos/:id', 'Obtém um Transferência agendada', true],
  ['put', '/pix/agendamentos/:id', 'Atualiza um Transferência agendada', true],
  ['patch', '/pix/agendamentos/:id/ativa', 'Ativa ou pausa um Transferência agendada', true],
  ['delete', '/pix/agendamentos/:id', 'Exclui um Transferência agendada', true],

  ['get', '/caixinhas', 'Lista as caixinhas', true],
  ['post', '/caixinhas', 'Cria uma caixinha', true],
  ['get', '/caixinhas/:id', 'Obtém uma caixinha', true],
  ['put', '/caixinhas/:id', 'Atualiza uma caixinha', true],
  ['delete', '/caixinhas/:id', 'Exclui uma caixinha', true],
  ['post', '/caixinhas/:id/aplicar', 'Aplica saldo na caixinha', true],
  ['post', '/caixinhas/:id/resgatar', 'Resgata saldo da caixinha', true],

  ['get', '/contatos', 'Lista os contatos salvos', true],
  ['post', '/contatos', 'Salva um contato (limite de 50)', true],
  ['get', '/contatos/:id', 'Obtém um contato', true],
  ['put', '/contatos/:id', 'Atualiza apelido ou chave do contato', true],
  ['delete', '/contatos/:id', 'Remove um contato', true],

  ['get', '/notificacoes', 'Lista notificações (?naoLidas=true)', true],
  ['patch', '/notificacoes/lidas', 'Marca todas as notificações como lidas', true],
  ['patch', '/notificacoes/:id/lida', 'Marca uma notificação como lida', true],
  ['delete', '/notificacoes/:id', 'Exclui uma notificação', true],

  ['get', '/relatorio', 'Relatório do cliente por período', true],
  ['post', '/relatorio/analise', 'Análise do relatório pelo Diamante (IA ou regras)', true],

  ['get', '/transacoes', 'Extrato com filtros (período, tipo, categoria, busca, paginação)', true],
  ['get', '/transacoes/:id', 'Comprovante de uma transação', true],

  ['get', '/admin/painel', 'Indicadores gerais do sistema', true],
  ['get', '/admin/clientes', 'Lista clientes (?status=, busca=, pagina=)', true],
  ['get', '/admin/clientes/:id', 'Obtém um cliente', true],
  ['put', '/admin/clientes/:id', 'Atualiza um cliente', true],
  ['delete', '/admin/clientes/:id', 'Exclui um cliente', true],
  ['patch', '/admin/clientes/:id/aprovar', 'Aprova um cliente pendente', true],
  ['patch', '/admin/clientes/:id/rejeitar', 'Rejeita um cliente', true],
  ['patch', '/admin/clientes/:id/bloquear', 'Bloqueia um cliente', true],
  ['patch', '/admin/clientes/:id/desbloquear', 'Desbloqueia um cliente', true],
  ['get', '/admin/clientes/:id/relatorio', 'Relatório de um cliente', true],
  ['post', '/admin/clientes/:id/relatorio/analise', 'Análise do relatório de um cliente pelo Diamante', true],
  ['get', '/admin/config', 'Configuração do sistema (taxas e data simulada)', true],
  ['put', '/admin/config/taxas', 'Atualiza as taxas', true],
  ['post', '/admin/relogio/avancar', 'Avança o relógio simulado ({dias} | {meses} | {ate})', true],
];

const TAGS = {
  saude: 'Sistema',
  auth: 'Autenticação',
  conta: 'Conta',
  pix: 'Transferência',
  caixinhas: 'Caixinhas',
  contatos: 'Contatos',
  notificacoes: 'Notificações',
  relatorio: 'Relatório',
  transacoes: 'Extrato',
  ia: 'IA',
  admin: 'Admin',
};

const CRIA = new Set([
  '/auth/register',
  '/pix/transferencias',
  '/pix/chaves',
  '/pix/agendamentos',
  '/caixinhas',
  '/contatos',
]);
const SEM_CORPO = new Set(['/auth/logout']);
const LIMITADAS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/relatorio/analise',
  '/admin/clientes/:id/relatorio/analise',
]);

const SENHA = { type: 'string', minLength: 8, maxLength: 72 };
const TEXTO = { type: 'string', minLength: 1 };
const EMAIL = { type: 'string', format: 'email' };
const NOME = { type: 'string', minLength: 2, maxLength: 80 };
const CENTAVOS = { type: 'integer', minimum: 1, maximum: 10_000_000_000 };
const CATEGORIA = { type: 'string', enum: CATEGORIAS };
const DATA = { type: 'string', format: 'date' };
const PERIODO = { inicio: DATA, fim: DATA, categoria: CATEGORIA };
const PERFIL = { nome: NOME, celular: TEXTO };
const CAIXINHA = {
  nome: { type: 'string', minLength: 1, maxLength: 40 },
  metaCentavos: { ...CENTAVOS, nullable: true },
};
const PIX = {
  chave: TEXTO,
  valorCentavos: CENTAVOS,
  categoria: { ...CATEGORIA, default: 'Outros' },
  descricao: { type: 'string', maxLength: 140 },
};
const AGENDAMENTO = {
  ...PIX,
  diaDoMes: { type: 'integer', minimum: 1, maximum: 28 },
  descricao: { ...PIX.descricao, minLength: 1 },
};
const CONTATO = { apelido: { type: 'string', minLength: 1, maxLength: 40 }, chave: TEXTO };
const PAGINACAO = {
  pagina: { type: 'integer', minimum: 1, default: 1 },
  limite: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
};
const CORPOS: Record<string, Schema> = {
  '/auth/register': obj(['nome', 'email', 'cpf', 'senha'], { ...PERFIL, email: EMAIL, cpf: TEXTO, senha: SENHA }),
  '/auth/login': obj(['email', 'senha'], { email: TEXTO, senha: TEXTO }),
  '/auth/forgot-password': obj(['email'], { email: EMAIL }),
  '/auth/reset-password': obj(['token', 'novaSenha'], { token: TEXTO, novaSenha: SENHA }),
  '/conta/perfil': obj([], PERFIL),
  '/conta/senha': obj(['senhaAtual', 'novaSenha'], { senhaAtual: TEXTO, novaSenha: SENHA }),
  '/pix/transferencias': obj(['chave', 'valorCentavos'], PIX),
  '/pix/chaves': obj(['tipo'], { tipo: { type: 'string', enum: TIPOS_CHAVE } }),
  '/pix/agendamentos': obj(['chave', 'valorCentavos', 'diaDoMes', 'descricao'], AGENDAMENTO),
  '/pix/agendamentos/:id': obj([], { ...AGENDAMENTO, categoria: CATEGORIA, ativa: { type: 'boolean' } }),
  '/pix/agendamentos/:id/ativa': obj(['ativa'], { ativa: { type: 'boolean' } }),
  '/caixinhas': obj(['nome'], CAIXINHA),
  '/caixinhas/:id': obj([], CAIXINHA),
  '/caixinhas/:id/aplicar': obj(['valorCentavos'], { valorCentavos: CENTAVOS }),
  '/caixinhas/:id/resgatar': obj(['valorCentavos'], { valorCentavos: CENTAVOS }),
  '/contatos': obj(['apelido', 'chave'], CONTATO),
  '/contatos/:id': obj([], CONTATO),
  '/relatorio/analise': obj([], PERIODO),
  '/admin/clientes/:id/relatorio/analise': obj([], PERIODO),
  '/admin/clientes/:id': obj([], { ...PERFIL, email: EMAIL }),
  '/admin/config/taxas': obj([], {
    indicePointsAnual: { type: 'number', minimum: 0, maximum: 100 },
    percentualCaixinha: { type: 'number', minimum: 0, maximum: 500 },
  }),
  '/admin/relogio/avancar': {
    ...obj([], {
      dias: { type: 'integer', minimum: 1, maximum: 400 },
      meses: { type: 'integer', minimum: 1, maximum: 12 },
      ate: DATA,
    }),
    description: 'Informe exatamente um campo. A nova data deve avançar de 1 a 400 dias.',
    oneOf: ['dias', 'meses', 'ate'].map((campo) => ({ required: [campo] })),
  },
};

const QUERY: Record<string, Record<string, Schema>> = {
  '/notificacoes': { ...PAGINACAO, naoLidas: { type: 'string', enum: ['true', 'false'] } },
  '/relatorio': PERIODO,
  '/admin/clientes/:id/relatorio': PERIODO,
  '/transacoes': {
    ...PERIODO,
    ...PAGINACAO,
    tipo: { type: 'string', enum: ['entrada', 'saida', 'caixinha'] },
    categoria: CATEGORIA,
    busca: { type: 'string', maxLength: 80 },
  },
  '/pix/destinatario': { chave: TEXTO },
  '/admin/clientes': { ...PAGINACAO, status: { type: 'string', enum: STATUS }, busca: { type: 'string' } },
};

const CAMPOS_IA = {
  fonte: { type: 'string', enum: ['gemini', 'regras'] },
  modelo: { type: 'string' },
  aviso: { type: 'string' },
};
const ANALISE = obj(['texto', 'fonte'], { texto: TEXTO, ...CAMPOS_IA });
const RESPOSTAS = {
  '/relatorio/analise': ANALISE,
  '/admin/clientes/:id/relatorio/analise': ANALISE,
};

function obj(obrigatorios: string[], propriedades: Record<string, Schema>): Schema {
  const schema: Schema = { type: 'object', properties: propriedades };
  if (obrigatorios.length) schema.required = obrigatorios;
  return schema;
}

const resposta = (descricao: string, schema: Schema) =>
  schema ? { description: descricao, content: { 'application/json': { schema } } } : { description: descricao };

const paths: Record<string, Record<string, Operacao>> = {};
for (const [metodo, rota, resumo, protegida] of ROTAS) {
  const parametros: Parametro[] = [...rota.matchAll(/:(\w+)/g)].map(([, nome]) => ({
    name: nome,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
  for (const [nome, schema] of Object.entries(QUERY[rota] || {})) {
    parametros.push({ name: nome, in: 'query', required: rota === '/pix/destinatario', schema });
  }

  const caminho = rota.replace(/:(\w+)/g, '{$1}');
  const pasta = rota.split('/')[1];
  const operacao: Operacao = {
    tags: [TAGS[pasta] || 'Outros'],
    summary: resumo,
    parameters: parametros,
    responses: {},
  };

  const ehCriacao = metodo === 'post' && CRIA.has(rota);
  if (metodo === 'delete' || SEM_CORPO.has(rota)) {
    operacao.responses['204'] = { description: 'Sem conteúdo' };
  } else if (ehCriacao) {
    operacao.responses['201'] = resposta('Criado', { type: 'object' });
  } else {
    operacao.responses['200'] = resposta('OK', RESPOSTAS[rota] || { type: 'object' });
  }

  const corpo = ['post', 'put', 'patch'].includes(metodo) && CORPOS[rota];
  if (corpo) {
    operacao.requestBody = {
      required: Boolean(corpo.required || corpo.oneOf),
      content: { 'application/json': { schema: corpo } },
    };
  }
  if (corpo || parametros.length) {
    operacao.responses['400'] = { $ref: '#/components/responses/Erro400' };
  }
  if (protegida) {
    operacao.responses['401'] = { $ref: '#/components/responses/Erro401' };
    operacao.responses['403'] = { $ref: '#/components/responses/Erro403' };
  } else {
    operacao.security = [];
  }
  if (rota.includes(':')) operacao.responses['404'] = { $ref: '#/components/responses/Erro404' };
  if (LIMITADAS.has(rota)) operacao.responses['429'] = { $ref: '#/components/responses/Erro429' };

  paths[caminho] = paths[caminho] || {};
  paths[caminho][metodo] = operacao;
}

const erro = (descricao) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
});

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'DOTE API',
    version: '0.1.0',
    description:
      'Banco simulado com pontos fictícios (P$). Campos terminados em Centavos usam centésimos inteiros de ponto. ' +
      'Autenticação por Bearer token (JWT) no header Authorization.',
  },
  servers: [{ url: '/api' }],
  tags: Object.values(TAGS).map((nome) => ({ name: nome })),
  security: [{ bearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          codigo: { type: 'string' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { campo: { type: 'string' }, mensagem: { type: 'string' } },
            },
          },
        },
      },
    },
    responses: {
      Erro400: erro('Dados inválidos ou regra de negócio violada'),
      Erro401: erro('Token ausente, inválido ou expirado'),
      Erro403: erro('Sem permissão, conta não ativa ou perfil incompatível'),
      Erro404: erro('Recurso não encontrado'),
      Erro429: erro('Limite de requisições excedido'),
    },
  },
};

module.exports = spec;
