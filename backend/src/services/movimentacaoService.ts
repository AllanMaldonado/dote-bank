const User = require('../models/User');
const { forbidden, unprocessable } = require('../utils/AppError');

const serializar = require('../utils/serializar');

class MovimentacaoService {
  comContaSerializada(usuarioId, operacao) {
    return serializar(`conta:${usuarioId}`, operacao);
  }

  async debitarConta(usuarioId, valor) {
    return this.comContaSerializada(usuarioId, async () => {
      const origem = await User.findOneAndUpdate(
        { _id: usuarioId, status: 'ativo', saldoCentavos: { $gte: valor } },
        { $inc: { saldoCentavos: -valor } },
        { projection: { nome: 1 }, lean: true },
      );
      if (origem) return origem;
      const atual = await User.findById(usuarioId, 'status').lean();
      if (atual?.status !== 'ativo') throw forbidden('Conta sem permissão para movimentar', 'conta_inativa');
      throw unprocessable('Saldo insuficiente', 'saldo_insuficiente');
    });
  }

  async creditarConta(usuarioId, valor) {
    const r = await User.updateOne({ _id: usuarioId, status: 'ativo' }, { $inc: { saldoCentavos: valor } });
    return r.modifiedCount === 1;
  }

  async estornar(usuarioId, ajuste) {
    const filtro = { _id: usuarioId, ...(ajuste < 0 && { saldoCentavos: { $gte: -ajuste } }) };
    const resultado = await User.updateOne(filtro, { $inc: { saldoCentavos: ajuste } });
    if (!resultado.modifiedCount) throw new Error('Não foi possível compensar o lançamento');
  }
}

module.exports = new MovimentacaoService();
