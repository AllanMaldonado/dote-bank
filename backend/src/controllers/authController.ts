const authService = require('../services/authService');
const { usuarioPublico } = require('../utils/dto');

class AuthController {
  async register(req, res) {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ token, user: usuarioPublico(user), message: 'Cadastro recebido. Aguarde a aprovação.' });
  }

  async login(req, res) {
    const { user, token } = await authService.login(req.body);
    res.json({ token, user: usuarioPublico(user) });
  }

  async logout(req, res) {
    await authService.logout(req.user._id);
    res.status(204).end();
  }

  me(req, res) {
    res.json({ user: usuarioPublico(req.user) });
  }

  async forgotPassword(req, res) {
    await authService.forgotPassword(req.body);
    res.json({ message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' });
  }

  async resetPassword(req, res) {
    await authService.resetPassword(req.body);
    res.json({ message: 'Senha redefinida. Entre com a nova senha.' });
  }
}

module.exports = new AuthController();
