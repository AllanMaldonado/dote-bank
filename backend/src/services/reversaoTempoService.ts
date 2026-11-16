const mongoose = require('mongoose');
const BackupReversao = require('../models/BackupReversao');
const Caixinha = require('../models/Caixinha');
const Config = require('../models/Config');
const DiaSimulado = require('../models/DiaSimulado');
const Notificacao = require('../models/Notificacao');
const Recorrencia = require('../models/TransferenciaRecorrente');
const Transacao = require('../models/Transacao');
const User = require('../models/User');
const { LIMITE_CAIXINHAS } = require('../models/constantes');
const { normalizarTipo } = require('../utils/compatibilidadeTransferencias');
const { AppError, conflict } = require('../utils/AppError');
const { taxasEfetivas } = require('../utils/regras');

const UM_DIA = 86_400_000;
const inicioDoDia = (data) => new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
const idDe = (id) => String(id);
const inconsistente = () =>
  conflict(
    'A reversão encontrou saldo insuficiente ou um registro financeiro ausente. Nenhuma alteração foi aplicada.',
    'reversao_inconsistente',
  );

function somar(ajustes, id, valor) {
  if (!id) throw inconsistente();
  const chave = idDe(id);
  ajustes.set(chave, (ajustes.get(chave) ?? 0) + valor);
}

function ajustesDasTransacoes(transacoes) {
  const contas = new Map();
  const caixinhas = new Map();
  for (const t of transacoes) {
    if (t.status !== 'concluida') continue;
    const valor = t.valorCentavos;
    switch (normalizarTipo(t.tipo)) {
      case 'deposito_inicial':
        somar(contas, t.destinoId, -valor);
        break;
      case 'transferencia':
      case 'recorrencia':
        somar(contas, t.origemId, valor);
        somar(contas, t.destinoId, -valor);
        break;
      case 'rendimento':
        somar(caixinhas, t.caixinhaId, -valor);
        break;
      case 'caixinha_aplicacao':
        somar(contas, t.origemId, valor);
        somar(caixinhas, t.caixinhaId, -valor);
        break;
      case 'caixinha_resgate':
        somar(contas, t.origemId, -valor);
        somar(caixinhas, t.caixinhaId, valor);
        break;
      default:
        throw inconsistente();
    }
  }
  return { contas, caixinhas };
}

function recalcularPendente(caixinha, limite, config, transacoes, taxa) {
  const ultimo = config.ultimoDiaJuros && inicioDoDia(config.ultimoDiaJuros);
  if (!ultimo || ultimo < limite) return { valor: caixinha.rendimentoPendente ?? 0, estimado: false };
  const movimentos = transacoes.filter((t) => t.status === 'concluida' && idDe(t.caixinhaId) === idDe(caixinha._id));
  const porDia = new Map<number, any[]>();
  let saldo = caixinha.saldoCentavos;
  let creditados = 0;
  for (const t of movimentos) {
    const dia = inicioDoDia(t.data).getTime();
    const lista = porDia.get(dia) ?? [];
    lista.push(t);
    porDia.set(dia, lista);
    if (t.tipo === 'rendimento') creditados += t.valorCentavos;
  }
  let acumulado = 0;
  for (let dia = ultimo.getTime(); dia >= limite.getTime(); dia -= UM_DIA) {
    for (const t of porDia.get(dia) ?? []) {
      saldo += t.tipo === 'caixinha_resgate' ? t.valorCentavos : -t.valorCentavos;
    }
    if (saldo < 0) throw inconsistente();
    acumulado += (saldo * taxa) / 100 / 365;
  }
  return { valor: Math.max(0, (caixinha.rendimentoPendente ?? 0) + creditados - acumulado), estimado: true };
}

async function aplicarSaldos(modelo, ajustes, existentes, session) {
  const porId = new Map(existentes.map((r) => [idDe(r._id), r]));
  for (const [id, ajuste] of ajustes) {
    const registro: any = porId.get(id);
    if (!registro || registro.saldoCentavos + ajuste < 0) throw inconsistente();
    const r = await modelo.updateOne({ _id: id }, { $inc: { saldoCentavos: ajuste } }, { session });
    if (!r.matchedCount) throw inconsistente();
  }
}

class ReversaoTempoService {
  async executar(bloqueio) {
    const hoje = inicioDoDia(new Date());
    const limite = new Date(hoje.getTime() + UM_DIA);
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(
        async () => {
          const config = await Config.findById('global').session(session).lean();
          const transacoes = await Transacao.find({ data: { $gte: limite } })
            .session(session)
            .lean();
          const diarios = await DiaSimulado.find({ _id: { $gte: limite } })
            .sort({ _id: 1 })
            .session(session)
            .lean();
          const caixinhas = await Caixinha.find().session(session).lean();
          const contas = await User.find({}, 'saldoCentavos status aprovadoEm').session(session).lean();
          const filtroNotificacoes = {
            $or: [{ data: { $gte: limite } }, { link: { $in: transacoes.map((t) => `/comprovante/${t._id}`) } }],
          };
          const notificacoes = await Notificacao.find(filtroNotificacoes).session(session).lean();
          const recorrencias = await Recorrencia.find().session(session).lean();
          const ajustes = ajustesDasTransacoes(transacoes);
          const reversaoId = new mongoose.Types.ObjectId();
          const backups = [
            { tipo: 'config', dados: config },
            ...transacoes.map((dados) => ({ tipo: 'transacao', dados })),
            ...caixinhas.map((dados) => ({ tipo: 'caixinha', dados })),
            ...contas.map((dados) => ({ tipo: 'conta', dados })),
            ...notificacoes.map((dados) => ({ tipo: 'notificacao', dados })),
            ...recorrencias.map((dados) => ({ tipo: 'recorrencia', dados })),
            ...diarios.map((dados) => ({ tipo: 'dia_simulado', dados })),
          ];
          await BackupReversao.insertMany(
            backups.map((b) => ({ ...b, reversaoId })),
            { session },
          );

          for (const id of ajustes.caixinhas.keys()) {
            if (caixinhas.some((c) => idDe(c._id) === id)) continue;
            const anterior = diarios.flatMap((d) => d.caixinhas).find((c) => idDe(c._id) === id);
            if (!anterior || !contas.some((u) => idDe(u._id) === idDe(anterior.usuarioId))) throw inconsistente();
            const total = caixinhas.filter((c) => idDe(c.usuarioId) === idDe(anterior.usuarioId)).length;
            if (total >= LIMITE_CAIXINHAS) {
              throw conflict(
                'A reversão ultrapassaria o limite de caixinhas da conta. Nenhuma alteração foi aplicada.',
                'limite_caixinhas',
              );
            }
            const restaurada = { ...anterior, saldoCentavos: 0, rendimentoPendente: 0 };
            await Caixinha.create([restaurada], { session });
            caixinhas.push(restaurada);
          }

          await aplicarSaldos(User, ajustes.contas, contas, session);
          await aplicarSaldos(Caixinha, ajustes.caixinhas, caixinhas, session);
          const primeiro = diarios[0];
          const referencias = new Map((primeiro?.caixinhas ?? []).map((c) => [idDe(c._id), c]));
          const fimLegado = primeiro ? new Date(primeiro._id.getTime() - UM_DIA) : config.ultimoDiaJuros;
          const movimentosLegado = primeiro ? transacoes.filter((t) => t.data < primeiro._id) : transacoes;
          const taxa = taxasEfetivas(config).taxaCaixinhaAnual;
          let jurosEstimados = false;
          for (const c of caixinhas) {
            const referencia: any = primeiro ? referencias.get(idDe(c._id)) : c;
            const juros = referencia
              ? recalcularPendente(referencia, limite, { ultimoDiaJuros: fimLegado }, movimentosLegado, taxa)
              : { valor: 0, estimado: false };
            jurosEstimados ||= juros.estimado;
            await Caixinha.updateOne(
              { _id: c._id },
              {
                $set: { rendimentoPendente: juros.valor },
                ...(c.metaAtingidaEm >= limite && { $unset: { metaAtingidaEm: '' } }),
              },
              { session },
            );
          }

          for (const r of recorrencias) {
            if (!(r.ultimaExecucao >= limite) && !transacoes.some((t) => idDe(t.recorrenciaId) === idDe(r._id)))
              continue;
            const anterior = await Transacao.findOne({ recorrenciaId: r._id, data: { $lt: limite } })
              .sort({ data: -1, createdAt: -1 })
              .session(session)
              .lean();
            const atualizacao = anterior
              ? { $set: { ultimaExecucao: anterior.data, ultimoStatus: anterior.status } }
              : { $unset: { ultimaExecucao: '', ultimoStatus: '' } };
            await Recorrencia.updateOne({ _id: r._id }, atualizacao, { session });
          }
          await User.updateMany(
            { aprovadoEm: { $gte: limite } },
            {
              $set: { status: 'pendente' },
              $unset: { aprovadoEm: '' },
              $inc: { tokenVersion: 1 },
            },
            { session },
          );
          await Transacao.deleteMany({ data: { $gte: limite } }, { session });
          await Notificacao.deleteMany(filtroNotificacoes, { session });
          await DiaSimulado.deleteMany({ _id: { $gte: limite } }, { session });
          const ultimoDiaJuros = config.ultimoDiaJuros > hoje ? hoje : config.ultimoDiaJuros;
          const atualizada = await Config.findByIdAndUpdate(
            'global',
            {
              $set: { dataSistema: hoje, dataProcessadaAte: hoje, ...(ultimoDiaJuros && { ultimoDiaJuros }) },
            },
            { new: true, session, lean: true },
          );
          const resumo = {
            transacoesRemovidas: transacoes.length,
            notificacoesRemovidas: notificacoes.length,
            jurosEstimados,
            backupId: idDe(reversaoId),
          };
          await BackupReversao.create([{ reversaoId, tipo: 'resumo', dados: { ...resumo, data: hoje } }], { session });
          await bloqueio.confirmar(session);
          return { config: atualizada, resumo };
        },
        { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10_000 },
      );
    } catch (erro) {
      if (erro.code === 20) {
        throw new AppError(
          503,
          'A reversão exige MongoDB com suporte a transações, como um replica set ou Atlas.',
          'transacoes_indisponiveis',
        );
      }
      throw erro;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new ReversaoTempoService();
