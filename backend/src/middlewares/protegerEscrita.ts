const bloqueioSistema = require('../services/bloqueioSistemaService');

module.exports = async function protegerEscrita(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.startsWith('/admin/relogio/')) return next();
  const bloqueio = await bloqueioSistema.adquirirEscrita();
  res.once('finish', () => {
    bloqueio.liberar().catch(() => console.error('[sistema] falha ao liberar operação'));
  });
  next();
};
