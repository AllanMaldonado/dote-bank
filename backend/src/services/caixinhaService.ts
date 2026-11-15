const Caixinha = require('../models/Caixinha');
const { LIMITE_CAIXINHAS } = require('../models/constantes');
const { forbidden, notFound, unprocessable } = require('../utils/AppError');
const movimentacaoService = require('./movimentacaoService');
const notificacaoService = require('./notificacaoService');
const relogioService = require('./relogioService');
const transacaoService = require('./transacaoService');
const serializar = require('../utils/serializar');

function marcarMeta(c, data) {
  if (!c.metaCentavos || c.metaAtingidaEm || c.saldoCentavos < c.metaCentavos) return false;
  c.metaAtingidaEm = data;
  return true;
}

const notificarMeta = (c, data) =>
  notificacaoService.notificarSemBloquear(
    c.usuarioId,
    'meta_atingida',
    { nome: c.nome, meta: c.metaCentavos, caixinhaId: c._id },
    data,
  );

const DESCRICAO = { caixinha_aplicacao: 'Aplicação na caixinha', caixinha_resgate: 'Resgate da caixinha' };

const registrarMovimento = (tipo, c, valor, data) =>
  transacaoService.registrar({
    tipo,
    origemId: c.usuarioId,
    destinoId: c.usuarioId,
    valorCentavos: valor,
    caixinhaId: c._id,
    caixinhaNome: c.nome,
    descricao: `${DESCRICAO[tipo]} ${c.nome}`,
    data,
  });

async function resgatarDe(c, valor, data) {

  return movimentacaoService.comContaSerializada(c.usuarioId, async () => {
    const atualizada = await Caixinha.findOneAndUpdate(
      { _id: c._id, saldoCentavos: { $gte: valor } },
      { $inc: { saldoCentavos: -valor } },
      { new: true },
    );
    if (!atualizada) throw unprocessable('Saldo da caixinha insuficiente', 'saldo_insuficiente');
    let creditou = false;
    try {
      creditou = await movimentacaoService.creditarConta(c.usuarioId, valor);
      if (!creditou) throw forbidden('Conta sem permissão para movimentar', 'conta_inativa');
      await registrarMovimento('caixinha_resgate', atualizada, valor, data);
      return atualizada;
    } catch (erro) {
      if (creditou) await movimentacaoService.estornar(c.usuarioId, -valor);
      await Caixinha.updateOne({ _id: c._id }, { $inc: { saldoCentavos: valor } });
      throw erro;
    }
  });
}

class CaixinhaService {
  listar(usuarioId) {
    return Caixinha.find({ usuarioId }).sort({ createdAt: 1 }).lean();
  }

  async totalGuardado(usuarioId) {
    const [r] = await Caixinha.aggregate([
      { $match: { usuarioId } },
      { $group: { _id: null, total: { $sum: '$saldoCentavos' } } },
    ]);
    return r?.total ?? 0;
  }

  async obter(usuarioId, id) {
    const c = await Caixinha.findOne({ _id: id, usuarioId });
    if (!c) throw notFound('Caixinha não encontrada');
    return c;
  }

  async criar(usuarioId, { nome, metaCentavos }) {
    return serializar(`caixinhas:${usuarioId}`, async () => {
      const total = await Caixinha.countDocuments({ usuarioId });
      if (total >= LIMITE_CAIXINHAS)
        throw unprocessable(`Limite de ${LIMITE_CAIXINHAS} caixinhas`, 'limite_caixinhas');
      return Caixinha.create({ usuarioId, nome, metaCentavos: metaCentavos ?? undefined });
    });
  }

  async atualizar(usuarioId, id, { nome, metaCentavos }) {
    return serializar(`caixinhas:${usuarioId}`, async () => {
      const [c, data] = await Promise.all([this.obter(usuarioId, id), relogioService.agora()]);
      if (nome !== undefined) c.nome = nome;
      if (metaCentavos !== undefined) {
        c.metaCentavos = metaCentavos ?? undefined;
        if (!c.metaCentavos || c.saldoCentavos < c.metaCentavos) c.metaAtingidaEm = undefined;
      }
      const atingiu = marcarMeta(c, data);
      await c.save();
      if (atingiu) await notificarMeta(c, data);
      return c;
    });
  }

  async aplicar(usuarioId, id, { valorCentavos }) {
    return serializar(`caixinhas:${usuarioId}`, async () => {
      const [c, data] = await Promise.all([this.obter(usuarioId, id), relogioService.agora()]);

      await movimentacaoService.debitarConta(usuarioId, valorCentavos);
      let atualizada;
      try {
        atualizada = await Caixinha.findByIdAndUpdate(
          c._id,
          { $inc: { saldoCentavos: valorCentavos } },
          { new: true },
        );
        if (!atualizada) throw notFound('Caixinha não encontrada');
        await registrarMovimento('caixinha_aplicacao', atualizada, valorCentavos, data);
      } catch (erro) {
        if (atualizada) await Caixinha.updateOne({ _id: c._id }, { $inc: { saldoCentavos: -valorCentavos } });
        await movimentacaoService.estornar(usuarioId, valorCentavos);
        throw erro;
      }

      if (marcarMeta(atualizada, data)) {
        await atualizada.save();
        await notificarMeta(atualizada, data);
      }
      return atualizada;
    });
  }

  async resgatar(usuarioId, id, { valorCentavos }) {
    return serializar(`caixinhas:${usuarioId}`, async () => {
      const [c, data] = await Promise.all([this.obter(usuarioId, id), relogioService.agora()]);
      return resgatarDe(c, valorCentavos, data);
    });
  }

  async excluir(usuarioId, id) {
    return serializar(`caixinhas:${usuarioId}`, async () => {
      const c = await this.obter(usuarioId, id);
      if (c.saldoCentavos > 0) await resgatarDe(c, c.saldoCentavos, await relogioService.agora());
      await c.deleteOne();
    });
  }

  async lancarRendimentos(data) {
    const totais = new Map();
    const caixinhas = await Caixinha.find(
      { rendimentoPendente: { $gte: 1 } },
      'rendimentoPendente usuarioId',
    ).lean();
    for (const { _id, usuarioId, rendimentoPendente } of caixinhas) {
      await serializar(`caixinhas:${usuarioId}`, async () => {
        const valor = Math.floor(rendimentoPendente);
        const c = await Caixinha.findOneAndUpdate(
          { _id, rendimentoPendente: { $gte: valor } },
          { $inc: { saldoCentavos: valor, rendimentoPendente: -valor } },
          { new: true },
        );
        if (!c) return;
        try {
          await transacaoService.registrar({
            tipo: 'rendimento',
            destinoId: c.usuarioId,
            valorCentavos: valor,
            caixinhaId: c._id,
            caixinhaNome: c.nome,
            descricao: `Rendimento da caixinha ${c.nome}`,
            data,
          });
        } catch (erro) {
          await Caixinha.updateOne({ _id }, { $inc: { saldoCentavos: -valor, rendimentoPendente: valor } });
          throw erro;
        }
        if (marcarMeta(c, data)) {
          await c.save();
          await notificarMeta(c, data);
        }
        const uid = String(c.usuarioId);
        totais.set(uid, (totais.get(uid) ?? 0) + valor);
      });
    }
    return totais;
  }
}

module.exports = new CaixinhaService();
