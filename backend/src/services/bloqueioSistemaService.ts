const { randomUUID } = require('node:crypto');
const BloqueioSistema = require('../models/BloqueioSistema');
const { conflict } = require('../utils/AppError');

const ID = 'financeiro';
const VALIDADE_MS = 10 * 60 * 1000;
const ocupado = () =>
  conflict('O sistema está processando outra operação. Aguarde e tente novamente.', 'sistema_ocupado');

async function adquirir(exclusivo) {
  try {
    await BloqueioSistema.updateOne({ _id: ID }, { $setOnInsert: { leitores: [] } }, { upsert: true });
  } catch (erro) {
    if (erro.code !== 11000) throw erro;
  }
  const agora = new Date();
  await BloqueioSistema.updateOne({ _id: ID }, { $pull: { leitores: { expiraEm: { $lte: agora } } } });
  await BloqueioSistema.updateOne({ _id: ID, 'exclusivo.expiraEm': { $lte: agora } }, { $unset: { exclusivo: '' } });
  const id = randomUUID();
  const concessao = { id, expiraEm: new Date(Date.now() + VALIDADE_MS) };
  const filtro = { _id: ID, exclusivo: { $exists: false }, ...(exclusivo && { leitores: { $size: 0 } }) };
  const atualizacao = exclusivo ? { $set: { exclusivo: concessao } } : { $push: { leitores: concessao } };
  const tentativas = exclusivo ? 100 : 1;
  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    if ((await BloqueioSistema.updateOne(filtro, atualizacao)).modifiedCount) {
      return {
        async confirmar(session) {
          const r = await BloqueioSistema.updateOne(
            { _id: ID, 'exclusivo.id': id },
            { $set: { 'exclusivo.expiraEm': new Date(Date.now() + VALIDADE_MS) } },
            { session },
          );
          if (!r.matchedCount) throw ocupado();
        },
        async liberar() {
          if (exclusivo) {
            await BloqueioSistema.updateOne({ _id: ID, 'exclusivo.id': id }, { $unset: { exclusivo: '' } });
          } else {
            await BloqueioSistema.updateOne({ _id: ID }, { $pull: { leitores: { id } } });
          }
        },
      };
    }
    if (exclusivo) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw ocupado();
}

module.exports = {
  adquirirEscrita: () => adquirir(false),
  async exclusivo(operacao) {
    const bloqueio = await adquirir(true);
    try {
      return await operacao(bloqueio);
    } finally {
      await bloqueio.liberar();
    }
  },
};
