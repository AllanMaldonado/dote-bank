const mongoose = require('mongoose');
const { CATEGORIAS } = require('./constantes');

const pixRecorrenteSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chaveDestino: { type: String, required: true },
    destinatarioNome: String,
    valorCentavos: { type: Number, required: true, min: 1, validate: Number.isInteger },
    diaDoMes: { type: Number, required: true, min: 1, max: 28 },
    categoria: { type: String, enum: CATEGORIAS, default: 'Outros' },
    descricao: { type: String, trim: true, maxlength: 140 },
    ativa: { type: Boolean, default: true },
    ultimaExecucao: Date,
    ultimoStatus: { type: String, enum: ['concluida', 'falhou'] },
  },
  { timestamps: true },
);

pixRecorrenteSchema.index({ ativa: 1, diaDoMes: 1 });  

module.exports = mongoose.model('PixRecorrente', pixRecorrenteSchema, 'recorrencias');
