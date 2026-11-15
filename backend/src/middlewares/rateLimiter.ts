const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (req, res) => {
    res
      .status(429)
      .json({ message: 'Muitas requisições. Tente novamente em instantes.', codigo: 'limite_requisicoes' });
  },
};

const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.baseUrl}${req.path}`,
});

const iaLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 15,
  keyGenerator: (req) => req.user.id,
});

module.exports = { authLimiter, iaLimiter };
