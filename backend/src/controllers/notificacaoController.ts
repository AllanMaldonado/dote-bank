const notificacaoService = require('../services/notificacaoService');
const { notificacaoPublica, paginado } = require('../utils/dto');
const { paginar } = require('../utils/validacao');

class NotificacaoController {
  async listar(req, res) {
    const pag = paginar(req.query);
    const r = await notificacaoService.listar(req.user._id, { ...pag, somenteNaoLidas: req.query.naoLidas === 'true' });
    res.json(paginado(pag, r, notificacaoPublica));
  }

  async marcarLida(req, res) {
    res.json(notificacaoPublica(await notificacaoService.marcarLida(req.user._id, req.params.id)));
  }

  async marcarTodasLidas(req, res) {
    res.json({ atualizadas: await notificacaoService.marcarTodasLidas(req.user._id) });
  }

  async excluir(req, res) {
    await notificacaoService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }
}

module.exports = new NotificacaoController();
