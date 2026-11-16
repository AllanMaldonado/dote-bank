const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  reversaoId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  tipo: { type: String, required: true },
  dados: mongoose.Schema.Types.Mixed,
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BackupReversao', backupSchema, 'backups_reversao');
