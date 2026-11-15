import mongoose from 'mongoose';
const env = require('./env');

async function conectarBanco(uri = env.mongoUri, dbName?: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, dbName ? { dbName } : {});
  return mongoose.connection;
}

const desconectarBanco = () => mongoose.disconnect();

async function resetarBanco() {
  if (env.isProd) throw new Error('resetarBanco não pode rodar em produção');
  // Aguarde índices automáticos antes de apagar coleções em testes/seed.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

module.exports = { conectarBanco, desconectarBanco, resetarBanco };
