const caixinhaService = require('../services/caixinhaService');
const { caixinhaPublica, lista } = require('../utils/dto');

class CaixinhaController {
  async listar(req, res) {
    res.json(lista(await caixinhaService.listar(req.user._id), caixinhaPublica));
  }

  async obter(req, res) {
    res.json(caixinhaPublica(await caixinhaService.obter(req.user._id, req.params.id)));
  }

  async criar(req, res) {
    res.status(201).json(caixinhaPublica(await caixinhaService.criar(req.user._id, req.body)));
  }

  async atualizar(req, res) {
    res.json(caixinhaPublica(await caixinhaService.atualizar(req.user._id, req.params.id, req.body)));
  }

  async excluir(req, res) {
    await caixinhaService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }

  async aplicar(req, res) {
    res.json(caixinhaPublica(await caixinhaService.aplicar(req.user._id, req.params.id, req.body)));
  }

  async resgatar(req, res) {
    res.json(caixinhaPublica(await caixinhaService.resgatar(req.user._id, req.params.id, req.body)));
  }
}

module.exports = new CaixinhaController();
