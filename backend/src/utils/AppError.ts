class AppError extends Error {
  constructor(public status: number, mensagem: string, public codigo: string, public detalhes?: unknown) {
    super(mensagem);
  }
}

const badRequest = (msg, codigo = 'requisicao_invalida') => new AppError(400, msg, codigo);
const unauthorized = (msg = 'Não autenticado', codigo = 'nao_autenticado') => new AppError(401, msg, codigo);
const forbidden = (msg = 'Acesso negado', codigo = 'acesso_negado') => new AppError(403, msg, codigo);
const notFound = (msg = 'Não encontrado', codigo = 'nao_encontrado') => new AppError(404, msg, codigo);
const conflict = (msg, codigo = 'conflito') => new AppError(409, msg, codigo);
const unprocessable = (msg, codigo = 'regra_de_negocio') => new AppError(422, msg, codigo);

module.exports = AppError;
module.exports.AppError = AppError;
module.exports.badRequest = badRequest;
module.exports.unauthorized = unauthorized;
module.exports.forbidden = forbidden;
module.exports.notFound = notFound;
module.exports.conflict = conflict;
module.exports.unprocessable = unprocessable;
