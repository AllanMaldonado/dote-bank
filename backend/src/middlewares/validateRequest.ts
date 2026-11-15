const AppError = require('../utils/AppError');

module.exports = (schema) => (req, res, next) => {
  const resultado = schema.safeParse({ body: req.body ?? {}, query: req.query });
  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((i) => ({ campo: i.path.slice(1).join('.'), mensagem: i.message }));
    return next(new AppError(400, detalhes[0].mensagem, 'validacao', detalhes));
  }
  const { body, query } = resultado.data;
  if (body !== undefined) req.body = body;
  if (query !== undefined) Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true });
  next();
};
