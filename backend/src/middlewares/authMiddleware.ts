const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ACESSO_NEGADO } = require('../models/constantes');
const { forbidden, unauthorized } = require('../utils/AppError');

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    throw unauthorized('Sessão inválida ou expirada');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.tokenVersion !== decoded.v) throw unauthorized('Sessão encerrada');

  const negado = ACESSO_NEGADO[user.status];
  if (negado) throw forbidden(negado.mensagem, negado.codigo);

  req.user = user;
  next();
};
