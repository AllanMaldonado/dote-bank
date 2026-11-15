const User = require('../models/User');
const { badRequest, conflict } = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const { taxasEfetivas } = require('../utils/regras');
const caixinhaService = require('./caixinhaService');
const chaveTransferenciaService = require('./chaveTransferenciaService');
const notificacaoService = require('./notificacaoService');
const relogioService = require('./relogioService');

class ContaService {
  async resumo(usuario) {
    const [config, caixinhasCentavos, notificacoesNaoLidas] = await Promise.all([
      relogioService.obterConfig(),
      caixinhaService.totalGuardado(usuario._id),
      notificacaoService.contarNaoLidas(usuario._id),
    ]);
    return {
      saldoCentavos: usuario.saldoCentavos,
      caixinhasCentavos,
      indicePointsAnual: config.indicePointsAnual,
      percentualCaixinha: config.percentualCaixinha,
      ...taxasEfetivas(config),
      dataSistema: config.dataSistema,
      notificacoesNaoLidas,
    };
  }

  async atualizarDados(usuario, dados, campos) {
    for (const campo of campos) {
      if (dados[campo] !== undefined) usuario[campo] = dados[campo];
    }
    if (usuario.isModified('email') && (await User.exists({ email: usuario.email, _id: { $ne: usuario._id } }))) {
      throw conflict('E-mail já em uso');
    }
    await usuario.save();
    await chaveTransferenciaService.sincronizarComCadastro(usuario);
    return usuario;
  }

  async trocarSenha(usuarioId, { senhaAtual, novaSenha }) {
    const user = await User.findById(usuarioId).select('+senha');
    if (!(await user.comparePassword(senhaAtual))) throw badRequest('Senha atual incorreta', 'senha_atual_incorreta');
    user.senha = novaSenha;
    user.tokenVersion += 1;
    await user.save();
    return { user, token: generateToken(user) };
  }
}

module.exports = new ContaService();
