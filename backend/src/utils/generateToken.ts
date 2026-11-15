const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (usuario) =>
  jwt.sign({ id: String(usuario._id), v: usuario.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

module.exports = generateToken;
