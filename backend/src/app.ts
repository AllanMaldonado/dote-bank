const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const api = require('./routes');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
if (!env.isTest) {
  morgan.token('caminho', (req) => req.path);
  app.use(morgan(':method :caminho :status :response-time ms'));
}
app.use(express.json({ limit: '100kb' }));
app.use('/api', api);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
