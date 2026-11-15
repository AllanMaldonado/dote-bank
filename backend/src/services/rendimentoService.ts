const Caixinha = require('../models/Caixinha');
const Config = require('../models/Config');
const User = require('../models/User');
const { taxasEfetivas } = require('../utils/regras');
const caixinhaService = require('./caixinhaService');
const notificacaoService = require('./notificacaoService');

const somarJurosDoDia = (taxaAnual) => [
  {
    $set: {
      rendimentoPendente: {
        $add: [
          { $ifNull: ['$rendimentoPendente', 0] },
          { $multiply: ['$saldoCentavos', taxaAnual / 100 / 365] },
        ],
      },
    },
  },
];

class RendimentoService {
  async acumularDia(config, dia) {
    if (config.ultimoDiaJuros && config.ultimoDiaJuros >= dia) return false;
    const { taxaCaixinhaAnual } = taxasEfetivas(config);
    const ativos = await User.find({ perfil: 'cliente', status: 'ativo' }, '_id').lean();
    const ids = ativos.map((u) => u._id);
    await Caixinha.updateMany(
      { usuarioId: { $in: ids }, saldoCentavos: { $gt: 0 } },
      somarJurosDoDia(taxaCaixinhaAnual),
    );
    await Config.updateOne({ _id: 'global' }, { $set: { ultimoDiaJuros: dia } });
    return true;
  }

  async lancarMes(data) {
    const totais = await caixinhaService.lancarRendimentos(data);

    let total = 0;
    for (const [usuarioId, valor] of totais) {
      total += valor;
      await notificacaoService.notificarSemBloquear(usuarioId, 'rendimento', { valor }, data);
    }
    return total;
  }
}

module.exports = new RendimentoService();
