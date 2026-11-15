import express from 'express';
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const { garantirBanco } = require('./config/database');
const swaggerSpec = require('./config/swagger');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const api = require('./routes');
const { geralLimiter } = require('./middlewares/rateLimiter');

const app = express();
app.disable('x-powered-by');
if (env.naVercel || process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
app.use(['/api', '/api-docs'], geralLimiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
if (!env.isTest) {
  morgan.token('caminho', (req) => req.path);
  app.use(morgan(':method :caminho :status :response-time ms'));
}
app.use(express.json({ limit: '100kb' }));
if (env.naVercel) {
  app.use('/api', async (req, res, next) => {
    try {
      const conexao = await garantirBanco();
      if (req.method === 'GET' && req.path === '/saude') await conexao.db.command({ ping: 1 });
      next();
    } catch (erro) {
      console.error('[mongo] conexão indisponível:', erro instanceof Error ? erro.name : 'erro');
      res.status(503).json({ message: 'Banco de dados temporariamente indisponível.', codigo: 'banco_indisponivel' });
    }
  });
}
app.use('/api', api);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
