const mongoose = require('mongoose');

const caixinhaSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    metaCentavos: { type: Number, min: 1, validate: Number.isInteger },
    saldoCentavos: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    rendimentoPendente: { type: Number, default: 0 },  
    metaAtingidaEm: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Caixinha', caixinhaSchema, 'caixinhas');
