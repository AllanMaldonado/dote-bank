const mongoose = require('mongoose');
const { conectarBanco, desconectarBanco } = require('../src/config/database');
const ChavePix = require('../src/models/ChavePix');
const Config = require('../src/models/Config');
const Contato = require('../src/models/Contato');
const PixRecorrente = require('../src/models/PixRecorrente');
const User = require('../src/models/User');

const ACADEMICO = /@[^\s@]+\.edu(\.br)?$/;
const DOMINIO = 'dote.com';

async function main() {
  await conectarBanco();
  const usuarios = await User.find({ email: ACADEMICO }, 'email').lean();
  let migrados = 0;
  for (const { _id, email } of usuarios) {
    const local = email.split('@')[0];
    let novo = `${local}@${DOMINIO}`;
    for (let n = 2; await User.exists({ email: novo, _id: { $ne: _id } }); n++) novo = `${local}${n}@${DOMINIO}`;
    await User.updateOne({ _id }, { $set: { email: novo } });
    await ChavePix.updateMany({ usuarioId: _id, tipo: 'email', valor: email }, { $set: { valor: novo } });
    await Contato.updateMany({ chaveDestino: email }, { $set: { chaveDestino: novo } });
    await PixRecorrente.updateMany({ chaveDestino: email }, { $set: { chaveDestino: novo } });
    console.log(`  ${email} → ${novo}`);
    migrados++;
  }
  await User.updateMany({}, { $unset: { rendimentoPendente: '' } }, { strict: false });
  await Config.updateOne(
    { _id: 'global' },
    { $unset: { cdiAnual: '', percentualCdiConta: '', percentualCdiCaixinha: '' } },
    { strict: false },
  );
  console.log(`Migração concluída no banco "${mongoose.connection.name}": ${migrados} e-mail(s) atualizado(s).`);
  await desconectarBanco();
}

main().catch(async (err) => {
  console.error(err);
  await desconectarBanco();
  process.exit(1);
});
