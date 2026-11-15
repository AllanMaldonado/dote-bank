const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    dataSistema: { type: Date, required: true },
    indicePointsAnual: { type: Number, default: 12, min: 0, max: 100 },  
    percentualCaixinha: { type: Number, default: 105, min: 0, max: 500 },  
    ultimoDiaJuros: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Config', configSchema, 'config');
