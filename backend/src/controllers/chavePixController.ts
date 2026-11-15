const chavePixService = require('../services/chavePixService');
const { chavePublica, lista } = require('../utils/dto');

class ChavePixController {
  async listar(req, res) {
    res.json(lista(await chavePixService.listar(req.user._id), chavePublica));
  }

  async obter(req, res) {
    res.json(chavePublica(await chavePixService.obter(req.user._id, req.params.id)));
  }

  async criar(req, res) {
    res.status(201).json(chavePublica(await chavePixService.criar(req.user, req.body)));
  }

  async atualizar(req, res) {
    res.json(chavePublica(await chavePixService.regenerarAleatoria(req.user._id, req.params.id)));
  }

  async excluir(req, res) {
    await chavePixService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }
}

module.exports = new ChavePixController();
