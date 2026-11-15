const contatoService = require('../services/contatoService');
const { contatoPublico, lista } = require('../utils/dto');

class ContatoController {
  async listar(req, res) {
    const contatos = await contatoService.listar(req.user._id);
    res.json(lista(contatos, contatoPublico));
  }

  async obter(req, res) {
    const contato = await contatoService.obter(req.user._id, req.params.id);
    res.json(contatoPublico(contato));
  }

  async criar(req, res) {
    const contato = await contatoService.criar(req.user._id, req.body);
    res.status(201).json(contatoPublico(contato));
  }

  async atualizar(req, res) {
    const contato = await contatoService.atualizar(req.user._id, req.params.id, req.body);
    res.json(contatoPublico(contato));
  }

  async excluir(req, res) {
    await contatoService.excluir(req.user._id, req.params.id);
    res.status(204).end();
  }
}

module.exports = new ContatoController();
