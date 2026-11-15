const Caixinha = require('../models/Caixinha');
const Transacao = require('../models/Transacao');
const User = require('../models/User');
const { notFound, unprocessable } = require('../utils/AppError');
const { escaparRegex, somenteDigitos } = require('../utils/validacao');
const chaveTransferenciaService = require('./chaveTransferenciaService');
const contaService = require('./contaService');
const notificacaoService = require('./notificacaoService');
const relogioService = require('./relogioService');
const transacaoService = require('./transacaoService');
const movimentacaoService = require('./movimentacaoService');
const { tiposTransferencia } = require('../utils/compatibilidadeTransferencias');

const SALDO_INICIAL_CENTAVOS = 1000_00;

const TRANSICOES = {
  aprovar: { de: 'pendente', para: 'ativo' },
  rejeitar: { de: 'pendente', para: 'rejeitado' },
  bloquear: { de: 'ativo', para: 'bloqueado', extra: { $inc: { tokenVersion: 1 } } },
  desbloquear: { de: 'bloqueado', para: 'ativo' },
};
const EXCLUIVEIS = ['pendente', 'rejeitado'];

const MESES_DO_PAINEL = 6;
const TRANSFERENCIAS_CONCLUIDAS = { tipo: { $in: [...tiposTransferencia, 'recorrencia'] }, status: 'concluida' };

async function transicionar(id, acao, update = {}, concluir = null) {
  return movimentacaoService.comContaSerializada(id, async () => {
    const { de, para, extra } = TRANSICOES[acao];
    const u = await User.findOneAndUpdate(
      { _id: id, perfil: 'cliente', status: de },
      { ...extra, ...update, status: para },
      { new: true },
    );
    if (!u) {
      const existe = await User.exists({ _id: id, perfil: 'cliente' });
      if (!existe) throw notFound('Cliente não encontrado');
      throw unprocessable(`Só contas com status "${de}" podem passar para "${para}"`, 'status_invalido');
    }
    if (concluir) await concluir(u);
    return u;
  });
}

function ultimosMeses(data, n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

class AdminService {
  async listarClientes({ status, busca }, { pular, limite }) {
    const filtro: { perfil: string; status?: string; $or?: Record<string, RegExp>[] } = { perfil: 'cliente' };
    if (status) filtro.status = status;
    if (busca) {
      const termo = new RegExp(escaparRegex(busca), 'i');
      const digitos = somenteDigitos(busca);
      filtro.$or = [{ nome: termo }, { email: termo }, ...(digitos ? [{ cpf: new RegExp(digitos) }] : [])];
    }
    const ordem = status === 'pendente' ? { createdAt: 1 } : { createdAt: -1 };
    const [itens, total] = await Promise.all([
      User.find(filtro).sort(ordem).skip(pular).limit(limite).lean(),
      User.countDocuments(filtro),
    ]);
    return { itens, total };
  }

  async obterCliente(id) {
    const u = await User.findOne({ _id: id, perfil: 'cliente' });
    if (!u) throw notFound('Cliente não encontrado');
    return u;
  }

  async atualizarCliente(id, dados) {
    return contaService.atualizarDados(await this.obterCliente(id), dados, ['nome', 'email', 'celular']);
  }

  async aprovar(id) {
    const data = await relogioService.agora();
    return transicionar(
      id,
      'aprovar',
      { aprovadoEm: data, $inc: { saldoCentavos: SALDO_INICIAL_CENTAVOS } },
      async (u) => {
        let t;
        try {
          t = await transacaoService.registrar({
            tipo: 'deposito_inicial',
            destinoId: u._id,
            valorCentavos: SALDO_INICIAL_CENTAVOS,
            descricao: 'Depósito inicial DOTE',
            data,
          });
        } catch (erro) {
          await User.updateOne(
            { _id: u._id },
            {
              $set: { status: 'pendente' },
              $unset: { aprovadoEm: 1 },
              $inc: { saldoCentavos: -SALDO_INICIAL_CENTAVOS },
            },
          );
          throw erro;
        }
        await notificacaoService.notificarSemBloquear(
          u._id,
          'conta_aprovada',
          { valor: SALDO_INICIAL_CENTAVOS, transacaoId: t._id },
          data,
        );
      },
    );
  }

  rejeitar(id) {
    return transicionar(id, 'rejeitar');
  }

  async bloquear(id) {
    const u = await transicionar(id, 'bloquear');
    await notificacaoService.notificarSemBloquear(u._id, 'conta_bloqueada');
    return u;
  }

  async desbloquear(id) {
    const u = await transicionar(id, 'desbloquear');
    await notificacaoService.notificarSemBloquear(u._id, 'conta_desbloqueada');
    return u;
  }

  async excluir(id) {
    return movimentacaoService.comContaSerializada(id, async () => {
      const u = await this.obterCliente(id);
      if (!EXCLUIVEIS.includes(u.status)) {
        throw unprocessable(
          'Só contas pendentes ou rejeitadas podem ser excluídas; bloqueie as demais',
          'status_invalido',
        );
      }
      await Promise.all([chaveTransferenciaService.excluirTodas(u._id), u.deleteOne()]);
    });
  }

  async painel() {
    const dataSistema = await relogioService.agora();
    const meses = ultimosMeses(dataSistema, MESES_DO_PAINEL);
    const inicio = new Date(`${meses[0]}-01T00:00:00.000Z`);

    const [porStatus, saldos, caixinhas, transferenciasTotal, transferenciasPorMes] = await Promise.all([
      User.aggregate([{ $match: { perfil: 'cliente' } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { perfil: 'cliente' } },
        { $group: { _id: null, total: { $sum: '$saldoCentavos' } } },
      ]),
      Caixinha.aggregate([{ $group: { _id: null, total: { $sum: '$saldoCentavos' } } }]),
      Transacao.aggregate([
        { $match: TRANSFERENCIAS_CONCLUIDAS },
        { $group: { _id: null, quantidade: { $sum: 1 }, volumeCentavos: { $sum: '$valorCentavos' } } },
      ]),
      Transacao.aggregate([
        { $match: { ...TRANSFERENCIAS_CONCLUIDAS, data: { $gte: inicio } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$data' } },
            quantidade: { $sum: 1 },
            volumeCentavos: { $sum: '$valorCentavos' },
          },
        },
      ]),
    ]);

    const clientes = { total: 0, pendente: 0, ativo: 0, bloqueado: 0, rejeitado: 0 };
    for (const { _id, total } of porStatus) {
      clientes[_id] = total;
      clientes.total += total;
    }
    const porMes = meses.map((mes) => {
      const m = transferenciasPorMes.find((p) => p._id === mes);
      return { mes, quantidade: m?.quantidade ?? 0, volumeCentavos: m?.volumeCentavos ?? 0 };
    });
    return {
      clientes,
      saldoTotalCentavos: saldos[0]?.total ?? 0,
      caixinhasCentavos: caixinhas[0]?.total ?? 0,
      transferencias: { quantidade: transferenciasTotal[0]?.quantidade ?? 0, volumeCentavos: transferenciasTotal[0]?.volumeCentavos ?? 0 },
      porMes,
      dataSistema,
    };
  }
}

module.exports = new AdminService();
