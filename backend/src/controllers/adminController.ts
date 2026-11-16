const adminService = require('../services/adminService');
const relogioService = require('../services/relogioService');
const tempoService = require('../services/tempoService');
const { configPublica, paginado, usuarioPublico } = require('../utils/dto');
const { paginar } = require('../utils/validacao');

class AdminController {
  async listarClientes(req, res) {
    const pag = paginar(req.query);
    const { status, busca } = req.query;
    res.json(paginado(pag, await adminService.listarClientes({ status, busca }, pag), usuarioPublico));
  }

  async obterCliente(req, res) {
    res.json(usuarioPublico(await adminService.obterCliente(req.params.id)));
  }

  async atualizarCliente(req, res) {
    res.json(usuarioPublico(await adminService.atualizarCliente(req.params.id, req.body)));
  }

  async aprovar(req, res) {
    res.json(usuarioPublico(await adminService.aprovar(req.params.id)));
  }

  async rejeitar(req, res) {
    res.json(usuarioPublico(await adminService.rejeitar(req.params.id)));
  }

  async bloquear(req, res) {
    res.json(usuarioPublico(await adminService.bloquear(req.params.id)));
  }

  async desbloquear(req, res) {
    res.json(usuarioPublico(await adminService.desbloquear(req.params.id)));
  }

  async excluirCliente(req, res) {
    await adminService.excluir(req.params.id);
    res.status(204).end();
  }

  async obterConfig(req, res) {
    res.json(configPublica(await relogioService.obterConfig()));
  }

  async atualizarTaxas(req, res) {
    res.json(configPublica(await relogioService.atualizarTaxas(req.body)));
  }

  async avancarRelogio(req, res) {
    const resumo = await tempoService.avancar(req.body);
    res.json({ config: configPublica(await relogioService.obterConfig()), resumo });
  }

  async sincronizarRelogio(req, res) {
    const { config, resumo } = await tempoService.sincronizarServidor();
    res.json({ ...configPublica(config), reversao: resumo });
  }

  async painel(req, res) {
    res.json(await adminService.painel());
  }
}

module.exports = new AdminController();
