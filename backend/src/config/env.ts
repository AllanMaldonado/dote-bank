require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const naVercel = process.env.VERCEL === '1';

const env = {
  nodeEnv,
  naVercel,
  isProd: nodeEnv === 'production',
  isDev: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/dote_dev',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelos: (process.env.GEMINI_MODELS || 'gemini-3.6-flash')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'DOTE <no-reply@dote.dev>',
  },
};

if (naVercel) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI é obrigatório na Vercel');
  if (!process.env.FRONTEND_URL || !/^https?:\/\/[^/?#]+$/.test(env.frontendUrl)) {
    throw new Error('FRONTEND_URL deve conter a origem do frontend');
  }
  if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres na Vercel');
}

if (!env.jwtSecret) {
  if (env.isProd) throw new Error('JWT_SECRET é obrigatório em produção');
  env.jwtSecret = 'dev-only-secret-nao-use-em-producao';
}

module.exports = env;
