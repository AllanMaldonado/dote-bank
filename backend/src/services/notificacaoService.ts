const Notificacao = require('../models/Notificacao');
const { notFound } = require('../utils/AppError');
const { formatMoney } = require('../utils/dinheiro');
const relogioService = require('./relogioService');

const comprovante = (transacaoId) => `/comprovante/${transacaoId}`;

const MODELOS = {
  pix_recebido: ({ valor, de, transacaoId }) => ({
    titulo: 'Transferência recebida',
    mensagem: `Você recebeu ${formatMoney(valor)} de ${de}.`,
    link: comprovante(transacaoId),
  }),
  pix_enviado: ({ valor, para, transacaoId }) => ({
    titulo: 'Transferência enviada',
    mensagem: `Transferência de ${formatMoney(valor)} para ${para} concluída.`,
    link: comprovante(transacaoId),
  }),
  recorrencia_executada: ({ valor, para, transacaoId }) => ({
    titulo: 'Transferência agendada enviada',
    mensagem: `Transferência agendada de ${formatMoney(valor)} para ${para} concluída.`,
    link: comprovante(transacaoId),
  }),
  recorrencia_falhou: ({ valor, para, descricao, motivo }) => ({
    titulo: 'Transferência agendada não enviada',
    mensagem: `"${descricao}" de ${formatMoney(valor)} para ${para} não foi enviada: ${motivo}.`,
    link: '/pix/agendamentos',
  }),
  rendimento: ({ valor }) => ({
    titulo: 'Rendimento creditado',
    mensagem: `Suas caixinhas renderam ${formatMoney(valor)} no último mês.`,
    link: '/extrato',
  }),
  meta_atingida: ({ nome, meta, caixinhaId }) => ({
    titulo: 'Meta atingida!',
    mensagem: `Sua caixinha "${nome}" chegou a ${formatMoney(meta)}.`,
    link: `/caixinhas/${caixinhaId}`,
  }),
  conta_aprovada: ({ valor, transacaoId }) => ({
    titulo: 'Conta aprovada!',
    mensagem: `Bem-vindo ao DOTE. Creditamos ${formatMoney(valor)} na sua conta.`,
    link: comprovante(transacaoId),
  }),
  conta_bloqueada: () => ({ titulo: 'Conta bloqueada', mensagem: 'Sua conta foi bloqueada pelo DOTE.' }),
  conta_desbloqueada: () => ({ titulo: 'Conta desbloqueada', mensagem: 'Sua conta voltou a operar normalmente.' }),
};

class NotificacaoService {
  async notificar(usuarioId, tipo, dados = {}, data) {
    return Notificacao.create({
      usuarioId,
      tipo,
      ...MODELOS[tipo](dados),
      data: data ?? (await relogioService.agora()),
    });
  }

  async notificarSemBloquear(usuarioId, tipo, dados, data) {
    try {
      await this.notificar(usuarioId, tipo, dados, data);
    } catch {
      console.error('[notificacao] falha ao gravar aviso', tipo);
    }
  }

  contarNaoLidas(usuarioId) {
    return Notificacao.countDocuments({ usuarioId, lida: false });
  }

  async listar(usuarioId, { pular, limite, somenteNaoLidas }) {
    const filtro = { usuarioId, ...(somenteNaoLidas ? { lida: false } : {}) };
    const [itens, total, naoLidas] = await Promise.all([
      Notificacao.find(filtro).sort({ createdAt: -1 }).skip(pular).limit(limite).lean(),
      Notificacao.countDocuments(filtro),
      this.contarNaoLidas(usuarioId),
    ]);
    return { itens, total, naoLidas };
  }

  async marcarLida(usuarioId, id) {
    const n = await Notificacao.findOneAndUpdate({ _id: id, usuarioId }, { lida: true }, { new: true, lean: true });
    if (!n) throw notFound('Notificação não encontrada');
    return n;
  }

  async marcarTodasLidas(usuarioId) {
    const r = await Notificacao.updateMany({ usuarioId, lida: false }, { lida: true });
    return r.modifiedCount;
  }

  async excluir(usuarioId, id) {
    const r = await Notificacao.deleteOne({ _id: id, usuarioId });
    if (!r.deletedCount) throw notFound('Notificação não encontrada');
  }
}

module.exports = new NotificacaoService();
