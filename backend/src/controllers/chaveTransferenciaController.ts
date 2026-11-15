const chaveTransferenciaService = require('../services/chaveTransferenciaService');
const { chavePublica, lista } = require('../utils/dto');

class ChaveTransferenciaController {
  async listar(req, res) {
    res.json(lista(await chaveTransferenciaService.listar(req.user._id), chavePublica));
  }

  async obter(req, res) {
    res.json(chavePublica(await chaveTransferenciaService.obter(req.user._id, req.params.id)));
  }

  async criar(req, res) {
    res.status(201).json(chavePublica(await chaveTransferenciaService.criar(req.user, req.body)));
  }

  async atualizar(req, res) {
    res.json(chavePublica(await chaveTransferenciaService.regenerarAleatoria(req.user._id, req.params.id)));
  }

  async excluir(req, res) {
    await chaveTransferenciaService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }
}

module.exports = new ChaveTransferenciaController();
