const mongoose = require('mongoose');

const concessao = new mongoose.Schema({ id: String, expiraEm: Date }, { _id: false });
const bloqueioSchema = new mongoose.Schema({
  _id: String,
  leitores: [concessao],
  exclusivo: concessao,
});

module.exports = mongoose.model('BloqueioSistema', bloqueioSchema, 'bloqueios_sistema');
