const transacaoService = require('../services/transacaoService');
const { paginado, transacaoPublica } = require('../utils/dto');
const { paginar } = require('../utils/validacao');

class TransacaoController {
  async extrato(req, res) {
    const { inicio, fim, tipo, categoria, busca } = req.query;
    const pag = paginar(req.query);
    const r = await transacaoService.extrato(req.user._id, { inicio, fim, direcao: tipo, categoria, busca }, pag);
    res.json(paginado(pag, r, (t) => transacaoPublica(t, req.user._id)));
  }

  async comprovante(req, res) {
    const t = await transacaoService.obter(req.params.id, {
      usuarioId: req.user._id,
      verTodas: req.user.perfil === 'admin',
    });
    res.json(transacaoPublica(t, req.user._id));
  }
}

module.exports = new TransacaoController();
