import mongoose from 'mongoose';
const env = require('../config/env');
const AppError = require('../utils/AppError');

module.exports = function errorMiddleware(err, req, res, next) {
  let status = 500;
  let codigo = 'erro_interno';
  let message = 'Erro interno do servidor';
  let detalhes;

  if (err instanceof AppError) {
    status = err.status;
    codigo = err.codigo;
    message = err.message;
    detalhes = err.detalhes;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    codigo = 'validacao';
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    codigo = 'id_invalido';
    message = `Valor inválido para ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    codigo = 'duplicado';
    message = `Já existe um registro com este ${Object.keys(err.keyValue ?? {}).join(', ') || 'valor'}`;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    codigo = 'corpo_muito_grande';
    message = 'Corpo da requisição excede o limite de 100 kB';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    codigo = 'json_invalido';
    message = 'JSON inválido no corpo da requisição';
  }

  if (status === 500 && !env.isTest) console.error(err);
  res.status(status).json({ message, codigo, ...(detalhes && { detalhes }) });
};
