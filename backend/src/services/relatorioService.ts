const mongoose = require('mongoose');
const { TIPOS_CAIXINHA } = require('../models/constantes');
const Transacao = require('../models/Transacao');
const User = require('../models/User');
const { badRequest } = require('../utils/AppError');
const caixinhaService = require('./caixinhaService');
const relogioService = require('./relogioService');

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const chaveMes = (d) => d.toISOString().slice(0, 7);  

function mesesDoPeriodo(inicio, fim) {
  const meses = [];
  for (
    let d = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), 1));
    d <= fim;
    d.setUTCMonth(d.getUTCMonth() + 1)
  ) {
    meses.push(chaveMes(d));
  }
  return meses;
}

type FiltrosRelatorio = { inicio?: Date; fim?: Date; categoria?: string };

async function resolverPeriodo({ inicio, fim }: FiltrosRelatorio) {
  const hoje = inicio && fim ? null : await relogioService.agora();
  const periodo = {
    inicio: inicio ?? new Date(Date.UTC(hoje.getUTCFullYear(), 0, 1)),
    fim: fim ?? hoje,
  };
  if (periodo.inicio > periodo.fim) throw badRequest('inicio deve ser anterior a fim');
  if (periodo.fim.getTime() - periodo.inicio.getTime() > 3 * 366 * UM_DIA_MS) throw badRequest('Período máximo de 3 anos');
  return periodo;
}

class RelatorioService {
  async gerar(usuarioId, filtros: FiltrosRelatorio = {}, { incluirDestinatarios = true } = {}) {
    const { inicio, fim } = await resolverPeriodo(filtros);
    const uid = new mongoose.Types.ObjectId(String(usuarioId));

    const [agregado] = await Transacao.aggregate([
      {
        $match: {
          status: 'concluida',
          tipo: { $nin: TIPOS_CAIXINHA },
          ...(filtros.categoria && { categoria: filtros.categoria }),
          data: { $gte: inicio, $lt: new Date(fim.getTime() + UM_DIA_MS) },
          $or: [{ origemId: uid }, { destinoId: uid }],
        },
      },
      {
        $set: {
          grupo: {
            $cond: [
              { $eq: ['$tipo', 'rendimento'] },
              'rendimentos',
              { $cond: [{ $eq: ['$destinoId', uid] }, 'entradas', 'saidas'] },
            ],
          },
          mes: { $dateToString: { format: '%Y-%m', date: '$data' } },
        },
      },
      {
        $facet: {
          porMes: [
            { $group: { _id: { mes: '$mes', grupo: '$grupo' }, total: { $sum: '$valorCentavos' }, qtd: { $sum: 1 } } },
          ],
          categorias: [
            { $match: { grupo: 'saidas' } },
            { $group: { _id: '$categoria', total: { $sum: '$valorCentavos' } } },
            { $sort: { total: -1 } },
          ],
          ...(incluirDestinatarios && {
            destinatarios: [
              { $match: { grupo: 'saidas' } },
              { $group: { _id: '$destinoId', total: { $sum: '$valorCentavos' }, quantidade: { $sum: 1 } } },
              { $sort: { total: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'usuarios',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'u',
                  pipeline: [{ $project: { nome: 1 } }],
                },
              },
            ],
          }),
        },
      },
    ]);

    const meses = Object.fromEntries(
      mesesDoPeriodo(inicio, fim).map((mes) => [
        mes,
        { mes, entradasCentavos: 0, saidasCentavos: 0, rendimentosCentavos: 0 },
      ]),
    );
    const totais = { entradasCentavos: 0, saidasCentavos: 0, rendimentosCentavos: 0, transacoes: 0, resultadoCentavos: 0 };
    for (const { _id, total, qtd } of agregado.porMes) {
      const campo = `${_id.grupo}Centavos`;
      if (meses[_id.mes]) meses[_id.mes][campo] += total;
      totais[campo] += total;
      totais.transacoes += qtd;
    }
    totais.resultadoCentavos = totais.entradasCentavos + totais.rendimentosCentavos - totais.saidasCentavos;

    const [usuario, caixinhasCentavos] = await Promise.all([
      User.findById(uid, 'saldoCentavos').lean(),
      caixinhaService.totalGuardado(uid),
    ]);

    return {
      periodo: { inicio, fim },
      saldoAtualCentavos: usuario?.saldoCentavos ?? 0,
      caixinhasCentavos,
      totais,
      meses: Object.values(meses),
      categorias: agregado.categorias.map((c) => ({
        categoria: c._id,
        totalCentavos: c.total,
        percentual: totais.saidasCentavos ? Math.round((c.total / totais.saidasCentavos) * 100) : 0,
      })),
      destinatarios: (agregado.destinatarios ?? []).map((d) => ({
        nome: d.u[0]?.nome ?? 'Conta removida',
        totalCentavos: d.total,
        quantidade: d.quantidade,
      })),
    };
  }
}

module.exports = new RelatorioService();
