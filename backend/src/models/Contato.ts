const mongoose = require('mongoose');

const contatoSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    apelido: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    chaveDestino: { type: String, required: true },
    destinatarioNome: String,
  },
  { timestamps: true },
);

contatoSchema.index({ usuarioId: 1, chaveDestino: 1 }, { unique: true });

module.exports = mongoose.model('Contato', contatoSchema, 'contatos');
