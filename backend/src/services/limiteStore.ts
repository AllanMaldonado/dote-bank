const { createHash } = require('node:crypto');
const { garantirBanco } = require('../config/database');
const indices = new WeakMap<object, Promise<unknown>>();


class LimiteStore {
  windowMs = 60_000;
  constructor(public prefix: string) {}

  init({ windowMs }) {
    this.windowMs = windowMs;
  }

  async colecao() {
    const conexao = await garantirBanco();
    const colecao = conexao.db.collection('limites_requisicoes');

    if (!indices.has(conexao.db)) {
      indices.set(
        conexao.db,
        colecao.createIndex({ resetTime: 1 }, { expireAfterSeconds: 0 }).catch((erro) => {
          indices.delete(conexao.db);
          throw erro;
        }),
      );
    }
    await indices.get(conexao.db);
    return colecao;
  }

  chave(key: string) {
    return this.prefix + ':' + createHash('sha256').update(key).digest('hex');
  }

  async increment(key: string) {
    const colecao = await this.colecao();
    const filtro = { _id: this.chave(key) };
    const venceu = { $lte: [{ $ifNull: ['$resetTime', new Date(0)] }, '$$NOW'] };
    const update = [
      {
        $set: {
          totalHits: { $cond: [venceu, 1, { $add: ['$totalHits', 1] }] },
          resetTime: { $cond: [venceu, { $add: ['$$NOW', this.windowMs] }, '$resetTime'] },
        },
      },
    ];
    const opcoes = { upsert: true, returnDocument: 'after', includeResultMetadata: false };
    let contador;
    try {
      contador = await colecao.findOneAndUpdate(filtro, update, opcoes);
    } catch (erro) {
      if (erro.code !== 11000) throw erro;

      contador = await colecao.findOneAndUpdate(filtro, update, opcoes);
    }
    return { totalHits: contador.totalHits, resetTime: contador.resetTime };
  }

  async decrement(key: string) {
    const colecao = await this.colecao();
    await colecao.updateOne({ _id: this.chave(key), totalHits: { $gt: 0 } }, { $inc: { totalHits: -1 } });
  }

  async resetKey(key: string) {
    const colecao = await this.colecao();
    await colecao.deleteOne({ _id: this.chave(key) });
  }
}

module.exports = LimiteStore;
