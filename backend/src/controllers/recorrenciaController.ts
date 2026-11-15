const recorrenciaService = require('../services/recorrenciaService');
const { lista, recorrenciaPublica } = require('../utils/dto');

class RecorrenciaController {
  async listar(req, res) {
    res.json(lista(await recorrenciaService.listar(req.user._id), recorrenciaPublica));
  }

  async obter(req, res) {
    res.json(recorrenciaPublica(await recorrenciaService.obter(req.user._id, req.params.id)));
  }

  async criar(req, res) {
    res.status(201).json(recorrenciaPublica(await recorrenciaService.criar(req.user._id, req.body)));
  }

  async atualizar(req, res) {
    res.json(recorrenciaPublica(await recorrenciaService.atualizar(req.user._id, req.params.id, req.body)));
  }

  async definirAtiva(req, res) {
    res.json(recorrenciaPublica(await recorrenciaService.definirAtiva(req.user._id, req.params.id, req.body.ativa)));
  }

  async excluir(req, res) {
    await recorrenciaService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }
}

module.exports = new RecorrenciaController();
