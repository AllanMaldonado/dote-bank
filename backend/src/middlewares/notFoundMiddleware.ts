module.exports = function notFoundMiddleware(req, res) {
  res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não existe`, codigo: 'rota_nao_encontrada' });
};
