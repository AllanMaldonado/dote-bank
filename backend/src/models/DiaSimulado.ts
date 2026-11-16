const mongoose = require('mongoose');

const diaSimuladoSchema = new mongoose.Schema({
  _id: Date,
  caixinhas: [mongoose.Schema.Types.Mixed],
});

module.exports = mongoose.model('DiaSimulado', diaSimuladoSchema, 'dias_simulados');
