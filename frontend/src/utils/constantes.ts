export const CATEGORIAS = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Contas', 'Outros'];
export const ICONES_CATEGORIAS = {
  Alimentação: 'mdi-silverware-fork-knife',
  Moradia: 'mdi-home-outline',
  Transporte: 'mdi-bus',
  Lazer: 'mdi-gamepad-variant-outline',
  Contas: 'mdi-receipt-text-outline',
  Outros: 'mdi-dots-horizontal',
};

export const LIMITE_CAIXINHAS = 6;

export const TIPOS_CHAVE = {
  cpf: 'CPF',
  email: 'E-mail',
  celular: 'Celular',
  aleatoria: 'Aleatória',
};

export const STATUS_CONTA = {
  pendente: { rotulo: 'pendente', classe: 'text-warning' },
  ativo: { rotulo: 'ativo', classe: 'text-neon-300' },
  bloqueado: { rotulo: 'bloqueado', classe: 'text-error' },
  rejeitado: { rotulo: 'rejeitado', classe: 'text-error' },
};
