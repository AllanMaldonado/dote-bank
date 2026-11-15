const assert = require('node:assert/strict');
const { test } = require('node:test');
const User = require('../src/models/User');
const chavePixService = require('../src/services/chavePixService');
const movimentacaoService = require('../src/services/movimentacaoService');
const notificacaoService = require('../src/services/notificacaoService');
const pixService = require('../src/services/pixService');
const relogioService = require('../src/services/relogioService');
const transacaoService = require('../src/services/transacaoService');

const hoje = new Date('2026-11-09');
const pedido = { chave: 'chave-ficticia', valorCentavos: 30, categoria: 'Outros' };

function simularBanco(t) {
  const saldos = { origem: 100, destino: 0 };
  const contas = {
    origem: { _id: 'origem', nome: 'Ana', status: 'ativo' },
    destino: { _id: 'destino', nome: 'Bruno', status: 'ativo' },
  };
  function alterar(filtro, alteracao) {
    const conta = contas[filtro._id];
    if (!conta || (filtro.status && filtro.status !== conta.status)) return null;
    if (saldos[conta._id] < (filtro.saldoCentavos?.$gte ?? 0)) return null;
    saldos[conta._id] += alteracao.$inc.saldoCentavos;
    return { _id: conta._id, nome: conta.nome };
  }
  t.mock.method(User, 'findOneAndUpdate', alterar);
  t.mock.method(User, 'updateOne', (filtro, alteracao) => ({ modifiedCount: Number(!!alterar(filtro, alteracao)) }));
  t.mock.method(User, 'findById', (id) => ({ lean: async () => contas[id] }));
  t.mock.method(chavePixService, 'resolverDestino', async () => ({
    chave: { valor: pedido.chave },
    destino: contas.destino,
  }));
  t.mock.method(relogioService, 'agora', async () => hoje);
  const notificar = t.mock.method(notificacaoService, 'notificar', async () => {});
  return { saldos, contas, notificar };
}

test('Pix restaura os dois saldos quando a transação não pode ser gravada', async (t) => {
  const { saldos, notificar } = simularBanco(t);
  const falha = new Error('falha simulada de gravação');
  t.mock.method(transacaoService, 'registrar', async () => {
    throw falha;
  });

  await assert.rejects(pixService.enviar('origem', pedido), (erro) => erro === falha);
  assert.deepEqual(saldos, { origem: 100, destino: 0 });
  assert.equal(notificar.mock.callCount(), 0);
});

test('um débito concorrente não pode gastar o crédito de um Pix que falhou', async (t) => {
  const { saldos } = simularBanco(t);
  let iniciouRegistro;
  const registrando = new Promise((resolve) => {
    iniciouRegistro = resolve;
  });
  let rejeitarRegistro;
  const registro = new Promise((resolve, reject) => {
    rejeitarRegistro = reject;
  });
  t.mock.method(transacaoService, 'registrar', async () => {
    iniciouRegistro();
    return registro;
  });

  const pix = assert.rejects(pixService.enviar('origem', pedido), /falha simulada/);
  await registrando;
  assert.equal(saldos.destino, 30);
  const debito = assert.rejects(movimentacaoService.debitarConta('destino', 30), { codigo: 'saldo_insuficiente' });
  rejeitarRegistro(new Error('falha simulada'));
  await Promise.all([pix, debito]);
  assert.deepEqual(saldos, { origem: 100, destino: 0 });
});

test('Pix devolve o débito quando o destino deixa de aceitar crédito', async (t) => {
  const { saldos, contas } = simularBanco(t);
  contas.destino.status = 'bloqueado';
  const registrar = t.mock.method(transacaoService, 'registrar', async () => {});
  await assert.rejects(pixService.enviar('origem', pedido), { codigo: 'destino_indisponivel' });
  assert.deepEqual(saldos, { origem: 100, destino: 0 });
  assert.equal(registrar.mock.callCount(), 0);
});

test('Pix gravado continua concluído quando os avisos falham', async (t) => {
  const { saldos, notificar } = simularBanco(t);
  notificar.mock.mockImplementation(async () => {
    throw new Error('aviso indisponível');
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(transacaoService, 'registrar', async (dados) => ({
    _id: 'comprovante',
    toObject: () => ({ ...dados, _id: 'comprovante', status: 'concluida' }),
  }));

  const pix = await pixService.enviar('origem', pedido);
  assert.deepEqual(saldos, { origem: 70, destino: 30 });
  assert.equal(pix._id, 'comprovante');
  assert.equal(pix.origemId.nome, 'Ana');
  assert.equal(pix.destinoId.nome, 'Bruno');
  assert.deepEqual(
    notificar.mock.calls.map(({ arguments: [, tipo] }) => tipo),
    ['pix_recebido', 'pix_enviado'],
  );
});
