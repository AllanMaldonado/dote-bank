const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');
const LimiteStore = require('../services/limiteStore');

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  passOnStoreError: false,
  skip: (req) => env.isTest || req.method === 'OPTIONS',
  handler: (req, res) => {
    res
      .status(429)
      .json({ message: 'Muitas requisições. Tente novamente em instantes.', codigo: 'limite_requisicoes' });
  },
};

const geralLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 120,
  store: new LimiteStore('geral'),
});

const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 20,
  store: new LimiteStore('autenticacao'),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

const iaLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 15,
  store: new LimiteStore('ia'),
  keyGenerator: (req) => req.user.id,
});

module.exports = { geralLimiter, authLimiter, iaLimiter };
