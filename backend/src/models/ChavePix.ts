const mongoose = require('mongoose');
const { TIPOS_CHAVE } = require('./constantes');

const chavePixSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tipo: { type: String, enum: TIPOS_CHAVE, required: true },
    valor: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ChavePix', chavePixSchema, 'chavespix');
