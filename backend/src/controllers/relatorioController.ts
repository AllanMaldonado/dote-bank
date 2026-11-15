const adminService = require('../services/adminService');
const iaService = require('../services/iaService');
const relatorioService = require('../services/relatorioService');

const titular = async (req) => (req.params.id ? adminService.obterCliente(req.params.id) : req.user);

class RelatorioController {
  async relatorio(req, res) {
    const usuario = await titular(req);
    res.json(await relatorioService.gerar(usuario._id, req.query));
  }

  async analise(req, res) {
    const usuario = await titular(req);
    const r = await relatorioService.gerar(usuario._id, req.body, { incluirDestinatarios: false });
    res.json(await iaService.analisarRelatorio(r));
  }
}

module.exports = new RelatorioController();
