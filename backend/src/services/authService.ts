const crypto = require('node:crypto');
const env = require('../config/env');
const User = require('../models/User');
const { ACESSO_NEGADO } = require('../models/constantes');
const { badRequest, conflict, forbidden, unauthorized } = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const emailService = require('./emailService');

const RESET_VALIDADE_MS = 15 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function gerarNumeroConta() {
  const base = String(crypto.randomInt(100000, 1000000));
  const soma = [...base].reduce((s, d, i) => s + Number(d) * (7 - i), 0);
  const dv = (11 - (soma % 11)) % 10;
  return `${base}-${dv}`;
}

async function numeroContaLivre() {
  for (;;) {
    const numero = gerarNumeroConta();
    if (!(await User.exists({ numeroConta: numero }))) return numero;
  }
}

class AuthService {
  async register({ nome, email, cpf, celular, senha }) {
    if (await User.exists({ $or: [{ email }, { cpf }] })) {
      throw conflict('Já existe uma conta com este e-mail ou CPF');
    }
    const user = await User.create({
      nome,
      email,
      cpf,
      celular,
      senha,
      perfil: 'cliente',
      status: 'pendente',
      numeroConta: await numeroContaLivre(),
    });
    return { user, token: generateToken(user) };
  }

  criarAdmin({ nome, email, cpf, senha }) {
    return User.create({ nome, email, cpf, senha, perfil: 'admin', status: 'ativo' });
  }

  async login({ email, senha }) {
    const user = await User.findOne({ email }).select('+senha');
    if (!user || !(await user.comparePassword(senha))) {
      throw unauthorized('E-mail ou senha inválidos', 'credenciais_invalidas');
    }
    const negado = ACESSO_NEGADO[user.status];
    if (negado) throw forbidden(negado.mensagem, negado.codigo);
    return { user, token: generateToken(user) };
  }

  async logout(usuarioId) {
    await User.updateOne({ _id: usuarioId }, { $inc: { tokenVersion: 1 } });
  }

  async forgotPassword({ email }) {
    const user = await User.findOne({ email });
    if (!user || user.status === 'rejeitado') return;

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + RESET_VALIDADE_MS);  
    await user.save();

    const link = `${env.frontendUrl}/redefinir-senha?token=${token}`;
    await emailService.enviarLinkReset({ para: user.email, nome: user.nome, link });
  }

  async resetPassword({ token, novaSenha }) {
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) throw badRequest('Link inválido ou expirado', 'token_invalido');

    user.senha = novaSenha;
    user.resetPasswordToken = undefined;  
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1;  
    await user.save();
  }
}

module.exports = new AuthService();
