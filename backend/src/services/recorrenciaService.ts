const PixRecorrente = require('../models/PixRecorrente');
const { notFound } = require('../utils/AppError');
const chavePixService = require('./chavePixService');
const notificacaoService = require('./notificacaoService');
const pixService = require('./pixService');
const transacaoService = require('./transacaoService');

const FALHAS_ESPERADAS = [
  'saldo_insuficiente',
  'destino_indisponivel',
  'chave_nao_encontrada',
  'pix_para_si',
];

class RecorrenciaService {
  listar(usuarioId) {
    return PixRecorrente.find({ usuarioId }).sort({ diaDoMes: 1, createdAt: 1 }).lean();
  }

  async obter(usuarioId, id) {
    const r = await PixRecorrente.findOne({ _id: id, usuarioId });
    if (!r) throw notFound('Recorrência não encontrada');
    return r;
  }

  async criar(usuarioId, { chave, ...campos }) {
    return PixRecorrente.create({
      usuarioId,
      ...(await chavePixService.resumirDestino(usuarioId, chave)),
      ...campos,
    });
  }

  async atualizar(usuarioId, id, { chave, ...campos }) {
    const r = await this.obter(usuarioId, id);
    if (chave !== undefined) Object.assign(r, await chavePixService.resumirDestino(usuarioId, chave));
    Object.assign(r, campos);
    return r.save();
  }

  async definirAtiva(usuarioId, id, ativa) {
    const r = await this.obter(usuarioId, id);
    r.ativa = ativa;
    return r.save();
  }

  async excluir(usuarioId, id) {
    const r = await this.obter(usuarioId, id);
    await r.deleteOne();
  }

  async executarDoDia(data) {
    const resultado = { executadas: 0, falhas: 0 };
    const agendadas = await PixRecorrente.find({
      ativa: true,
      diaDoMes: data.getUTCDate(),
      ultimaExecucao: { $ne: data },
    });
    for (const r of agendadas) {
      const pedido = {
        chave: r.chaveDestino,
        valorCentavos: r.valorCentavos,
        categoria: r.categoria,
        descricao: r.descricao,
      };
      try {
        const t = await pixService.transferir(r.usuarioId, pedido, { recorrenciaId: r._id, data });
        r.ultimoStatus = 'concluida';
        r.ultimaExecucao = data;
        await r.save();
        await notificacaoService.notificarSemBloquear(
          r.usuarioId,
          'recorrencia_executada',
          { valor: r.valorCentavos, para: t.destinoId.nome, transacaoId: t._id },
          data,
        );
        resultado.executadas++;
      } catch (err) {
        if (err.codigo === 'conta_inativa') continue;
        if (!FALHAS_ESPERADAS.includes(err.codigo)) throw err;
        await transacaoService.registrar({
          tipo: 'recorrencia',
          status: 'falhou',
          origemId: r.usuarioId,
          valorCentavos: r.valorCentavos,
          categoria: r.categoria,
          descricao: r.descricao,
          chaveDestino: r.chaveDestino,
          recorrenciaId: r._id,
          motivoFalha: err.message,
          data,
        });
        r.ultimoStatus = 'falhou';
        r.ultimaExecucao = data;
        await r.save();
        const dados = {
          valor: r.valorCentavos,
          para: r.destinatarioNome,
          descricao: r.descricao,
          motivo: err.message.toLowerCase(),
        };
        await notificacaoService.notificarSemBloquear(r.usuarioId, 'recorrencia_falhou', dados, data);
        resultado.falhas++;
      }
    }
    return resultado;
  }
}

module.exports = new RecorrenciaService();
