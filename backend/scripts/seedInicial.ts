const mongoose = require('mongoose');
const { z } = require('zod');
const { conectarBanco, desconectarBanco } = require('../src/config/database');
const User = require('../src/models/User');
const { nome, email, cpf, senha } = require('../src/validators/comum');
const { popular } = require('./seed');

const ID = 'demonstracao-v1';
const credenciais = z.object({
  admin: z.object({ nome, email, cpf, senha }),
  senhaClientes: senha,
});

async function seedInicial() {
  await conectarBanco();
  try {
    const registros = mongoose.connection.db.collection('inicializacoes');
    const anterior = await registros.findOne({ _id: ID });
    if (anterior?.status === 'concluido') {
      console.log('Demonstração já inicializada.');
      return;
    }
    if (anterior)
      throw new Error(
        'Existe uma inicialização em andamento ou interrompida. Revise seu estado antes de repetir.',
      );
    if (await User.exists({})) {
      throw new Error(
        'O cenário de demonstração exige banco vazio porque altera o relógio global e executa agendamentos.',
      );
    }
    const dados = credenciais.safeParse({
      admin: {
        nome: process.env.DOTE_ADMIN_NOME,
        email: process.env.DOTE_ADMIN_EMAIL,
        cpf: process.env.DOTE_ADMIN_CPF,
        senha: process.env.DOTE_ADMIN_SENHA,
      },
      senhaClientes: process.env.SEED_DEMO_SENHA,
    });
    if (!dados.success) {
      throw new Error(
        'Configure DOTE_ADMIN_NOME, DOTE_ADMIN_EMAIL, DOTE_ADMIN_CPF, DOTE_ADMIN_SENHA e SEED_DEMO_SENHA no terminal.',
      );
    }
    try {
      await registros.insertOne({ _id: ID, status: 'executando', iniciadoEm: new Date() });
    } catch (erro) {
      if (erro.code === 11000) throw new Error('Outro processo já iniciou a demonstração.');
      throw erro;
    }
    try {
      await popular({ reiniciarBanco: false, ...dados.data });
      await registros.updateOne({ _id: ID }, { $set: { status: 'concluido', concluidoEm: new Date() } });
      console.log('Inicialização registrada. Novas execuções preservam os dados.');
    } catch (erro) {
      await registros.updateOne(
        { _id: ID },
        { $set: { status: 'interrompido', interrompidoEm: new Date() } },
      );
      throw erro;
    }
  } finally {
    await desconectarBanco();
  }
}

if (require.main === module) {
  seedInicial().catch((erro) => {

    console.error(
      erro.name === 'Error'
        ? erro.message
        : 'Falha de conexão ou persistência ao inicializar a demonstração.',
    );
    process.exitCode = 1;
  });
}

module.exports = { seedInicial };
