const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { STATUS } = require('./constantes');

const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cpf: { type: String, required: true, unique: true, match: /^\d{11}$/ },
    celular: { type: String, match: /^\d{11}$/ },
    numeroConta: { type: String, unique: true, sparse: true, match: /^\d{6}-\d$/ },
    senha: { type: String, required: true, select: false },
    perfil: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
    status: { type: String, enum: STATUS, default: 'pendente', index: true },
    saldoCentavos: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    tokenVersion: { type: Number, default: 0 },
    resetPasswordToken: { type: String, select: false, index: { sparse: true } },
    resetPasswordExpires: { type: Date, select: false },
    aprovadoEm: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashSenha() {
  if (!this.isModified('senha')) return;
  this.senha = await bcrypt.hash(this.senha, 10);
});

userSchema.methods.comparePassword = function comparePassword(senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', userSchema, 'usuarios');
