const { forbidden } = require('../utils/AppError');

const authorize =
  (...perfis) =>
  (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      throw forbidden(perfis.includes('admin') ? 'Apenas o administrador' : 'Apenas clientes');
    }
    next();
  };

function exigirAtivo(req, res, next) {
  const { status } = req.user;
  if (status === 'pendente') throw forbidden('Conta aguardando aprovação', 'conta_pendente');
  if (status !== 'ativo') throw forbidden('Conta sem acesso', `conta_${status}`);
  next();
}

module.exports = { authorize, exigirAtivo };
