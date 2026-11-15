const mongoose = require('mongoose');
const { TIPOS_NOTIFICACAO } = require('./constantes');

const notificacaoSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { type: String, enum: TIPOS_NOTIFICACAO, required: true },
    titulo: { type: String, required: true },
    mensagem: { type: String, required: true },
    link: String,  
    lida: { type: Boolean, default: false },
    data: { type: Date, required: true },  
  },
  { timestamps: true },
);

notificacaoSchema.index({ usuarioId: 1, createdAt: -1 });  
notificacaoSchema.index({ usuarioId: 1, lida: 1 });  

module.exports = mongoose.model('Notificacao', notificacaoSchema, 'notificacoes');
