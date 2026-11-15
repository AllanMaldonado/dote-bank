const mongoose = require('mongoose');
const { badRequest } = require('../utils/AppError');

module.exports = function validarId(req, res, next, id) {
  if (!mongoose.isValidObjectId(id)) return next(badRequest('id inválido', 'id_invalido'));
  next();
};
