const chavePixService = require('./chavePixService');
const movimentacaoService = require('./movimentacaoService');
const notificacaoService = require('./notificacaoService');
const relogioService = require('./relogioService');
const transacaoService = require('./transacaoService');

class PixService {
  consultarDestinatario(entrada) {
    return chavePixService.resolverDestino(entrada);
  }

  async transferir(origemId, { chave, valorCentavos, categoria, descricao }, { recorrenciaId, data }: { recorrenciaId?: unknown; data?: Date } = {}) {
    const [{ chave: chaveDestino, destino }, hoje] = await Promise.all([
      chavePixService.resolverDestino(chave, { origemId }),
      data ?? relogioService.agora(),
    ]);

    const origem = await movimentacaoService.debitarConta(origemId, valorCentavos);
    const transacao = await movimentacaoService.comContaSerializada(destino._id, async () => {
      let creditou = false;
      try {
        creditou = await movimentacaoService.creditarConta(destino._id, valorCentavos);
        if (!creditou) throw chavePixService.erroDestinoIndisponivel();
        return await transacaoService.registrar({
          categoria,
          descricao,
          tipo: recorrenciaId ? 'recorrencia' : 'pix',
          origemId,
          destinoId: destino._id,
          valorCentavos,
          chaveDestino: chaveDestino.valor,
          recorrenciaId,
          data: hoje,
        });
      } catch (erro) {
        if (creditou) await movimentacaoService.estornar(destino._id, -valorCentavos);
        await movimentacaoService.estornar(origemId, valorCentavos);
        throw erro;
      }
    });
    await notificacaoService.notificarSemBloquear(
      destino._id,
      'pix_recebido',
      { valor: valorCentavos, de: origem.nome, transacaoId: transacao._id },
      hoje,
    );
    return {
      ...transacao.toObject(),
      origemId: origem,
      destinoId: { _id: destino._id, nome: destino.nome },
    };
  }

  async enviar(usuarioId, dados) {
    const t = await this.transferir(usuarioId, dados);
    await notificacaoService.notificarSemBloquear(
      usuarioId,
      'pix_enviado',
      { valor: t.valorCentavos, para: t.destinoId.nome, transacaoId: t._id },
      t.data,
    );
    return t;
  }
}

module.exports = new PixService();
