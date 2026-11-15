
const AGENCIA = '0001';

const STATUS = ['pendente', 'ativo', 'rejeitado', 'bloqueado'];

const ACESSO_NEGADO = {
  bloqueado: { codigo: 'conta_bloqueada', mensagem: 'Conta bloqueada. Fale com o DOTE.' },
  rejeitado: { codigo: 'conta_rejeitada', mensagem: 'Cadastro não aprovado.' },
};

const CATEGORIAS = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Contas', 'Outros'];

const TIPOS_CHAVE = ['cpf', 'email', 'celular', 'aleatoria'];
const LIMITE_CHAVES = 5;
const LIMITE_CAIXINHAS = 6;
const LIMITE_CONTATOS = 50;

const TIPOS_CAIXINHA = ['caixinha_aplicacao', 'caixinha_resgate'];

const POPULAR_PARTES = [
  { path: 'origemId', select: 'nome' },
  { path: 'destinoId', select: 'nome' },
];

const TIPOS_NOTIFICACAO = [
  'pix_recebido',
  'pix_enviado',
  'recorrencia_executada',
  'recorrencia_falhou',
  'rendimento',
  'meta_atingida',
  'conta_aprovada',
  'conta_bloqueada',
  'conta_desbloqueada',
  'orcamento_estourado',  
];

module.exports = {
  AGENCIA,
  STATUS,
  ACESSO_NEGADO,
  CATEGORIAS,
  TIPOS_CHAVE,
  LIMITE_CHAVES,
  LIMITE_CAIXINHAS,
  LIMITE_CONTATOS,
  TIPOS_CAIXINHA,
  POPULAR_PARTES,
  TIPOS_NOTIFICACAO,
};
