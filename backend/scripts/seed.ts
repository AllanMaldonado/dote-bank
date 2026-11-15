const mongoose = require('mongoose');
const { conectarBanco, desconectarBanco, resetarBanco } = require('../src/config/database');
const Notificacao = require('../src/models/Notificacao');
const adminService = require('../src/services/adminService');
const authService = require('../src/services/authService');
const caixinhaService = require('../src/services/caixinhaService');
const chaveTransferenciaService = require('../src/services/chaveTransferenciaService');
const transferenciaService = require('../src/services/transferenciaService');
const recorrenciaService = require('../src/services/recorrenciaService');
const relogioService = require('../src/services/relogioService');
const tempoService = require('../src/services/tempoService');

const SENHA = '12345678';

const CONTAS = { admin: 'admin@dote.com', allan: 'allan@dote.com', caio: 'caio@dote.com' };

async function popular({
  reiniciarBanco = true,
  admin = { nome: 'Admin DOTE', email: CONTAS.admin, cpf: '00000000191', senha: 'admin123' },
  senhaClientes = SENHA,
} = {}) {
  if (reiniciarBanco) await resetarBanco();

  await relogioService.definirData(new Date('2026-01-02T00:00:00Z'));
  await authService.criarAdmin(admin);

  async function cliente(nome, email, cpf, celular) {
    const { user } = await authService.register({ nome, email, cpf, celular, senha: senhaClientes });
    return adminService.aprovar(user._id);
  }

  const allan = await cliente('Allan Maldonado', CONTAS.allan, '52998224725', '18991110001');
  const caio = await cliente('Caio Collete', CONTAS.caio, '39053344705', '18991110002');

  for (const u of [allan, caio]) {
    await chaveTransferenciaService.criar(u, { tipo: 'email' });
    await chaveTransferenciaService.criar(u, { tipo: 'cpf' });
  }
  await chaveTransferenciaService.criar(allan, { tipo: 'celular' });

  const transferencia = (de, para, valorCentavos, categoria, descricao) =>
    transferenciaService.enviar(de._id, { chave: para.email, valorCentavos, categoria, descricao });

  await transferencia(caio, allan, 4000, 'Lazer', 'Ingresso do show');
  await transferencia(allan, caio, 6790, 'Alimentação', 'Mercado');
  await transferencia(caio, allan, 1500, 'Transporte', 'Carona');

  const CAIXINHAS_ALLAN = [
    ['Notebook', 150000, 8000],
    ['Viagem', 200000, 5000],
    ['Reserva', 100000, 4000],
    ['Presente', 30000, 2500],
    ['Curso', 80000, 2000],
    ['Bike', 120000, 1500],
  ];
  for (const [nome, metaCentavos, valorCentavos] of CAIXINHAS_ALLAN) {
    const cx = await caixinhaService.criar(allan._id, { nome, metaCentavos });
    await caixinhaService.aplicar(allan._id, cx._id, { valorCentavos });
  }
  const viagemCaio = await caixinhaService.criar(caio._id, { nome: 'Viagem', metaCentavos: 150000 });
  await caixinhaService.aplicar(caio._id, viagemCaio._id, { valorCentavos: 3000 });

  await recorrenciaService.criar(allan._id, {
    chave: caio.email,
    valorCentavos: 30000,
    diaDoMes: 5,
    categoria: 'Moradia',
    descricao: 'Aluguel',
  });
  await recorrenciaService.criar(caio._id, {
    chave: allan.email,
    valorCentavos: 4990,
    diaDoMes: 10,
    categoria: 'Contas',
    descricao: 'Internet',
  });

  const MESES = 10;
  const variar = (base, mes, passo) => base + ((mes * passo) % 7) * 500;
  for (let mes = 0; mes < MESES; mes++) {
    await tempoService.avancar({ ate: `2026-${String(mes + 1).padStart(2, '0')}-15` });
    await transferencia(caio, allan, 35000, 'Outros', 'Pagamento de freela');
    await transferencia(allan, caio, variar(8000, mes, 3), 'Alimentação', 'Mercado');
    await transferencia(caio, allan, variar(1500, mes, 2), 'Transporte', 'Carona');
    if (mes % 3 === 1) await transferencia(allan, caio, variar(3000, mes, 4), 'Lazer', 'Churrasco');
  }
  await tempoService.avancar({ ate: '2026-11-05' });
  await Notificacao.updateMany({ data: { $lt: new Date('2026-10-01T00:00:00Z') } }, { lida: true });

  console.log(`Dados de demonstração criados no banco "${mongoose.connection.name}".`);
  console.log('Contas e histórico de demonstração criados.');
}

module.exports = { popular };

if (require.main === module) {
  conectarBanco()
    .then(popular)
    .then(desconectarBanco)
    .catch(async (err) => {
      console.error(err);
      await desconectarBanco();
      process.exit(1);
    });
}
