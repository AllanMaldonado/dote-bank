const mongoose = require('mongoose');
const { CATEGORIAS } = require('./constantes');
const { tiposTransferencia } = require('../utils/compatibilidadeTransferencias');

const TIPOS_TRANSACAO = [
  'deposito_inicial',
  ...tiposTransferencia,
  'recorrencia',
  'rendimento',
  'caixinha_aplicacao',
  'caixinha_resgate',
];

const transacaoSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true },
    tipo: { type: String, enum: TIPOS_TRANSACAO, required: true },
    status: { type: String, enum: ['concluida', 'falhou'], default: 'concluida' },
    origemId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    destinoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    valorCentavos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    categoria: { type: String, enum: CATEGORIAS, default: 'Outros' },
    descricao: { type: String, maxlength: 140, trim: true },
    chaveDestino: String,
    caixinhaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caixinha' },
    caixinhaNome: String,
    recorrenciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransferenciaRecorrente' },
    motivoFalha: String,
    data: { type: Date, required: true },
  },
  { timestamps: true },
);

transacaoSchema.index({ origemId: 1, data: -1, createdAt: -1 });
transacaoSchema.index({ destinoId: 1, data: -1, createdAt: -1 });

module.exports = mongoose.model('Transacao', transacaoSchema, 'transacoes');
