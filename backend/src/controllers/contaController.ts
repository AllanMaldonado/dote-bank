const contaService = require('../services/contaService');
const { usuarioPublico } = require('../utils/dto');

class ContaController {
  async resumo(req, res) {
    res.json(await contaService.resumo(req.user));
  }

  async atualizarPerfil(req, res) {
    const u = await contaService.atualizarDados(req.user, req.body, ['nome', 'celular']);
    res.json({ user: usuarioPublico(u) });
  }

  async trocarSenha(req, res) {
    const { user, token } = await contaService.trocarSenha(req.user._id, req.body);
    res.json({ token, user: usuarioPublico(user), message: 'Senha alterada.' });
  }
}

module.exports = new ContaController();
