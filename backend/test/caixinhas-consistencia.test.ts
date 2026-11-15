const assert = require('node:assert/strict');
const { after, before, beforeEach, describe, test } = require('node:test');
const { iniciarBanco, encerrarBanco, criarAdmin, criarClienteAtivo } = require('./helpers');
const Caixinha = require('../src/models/Caixinha');
const User = require('../src/models/User');
const caixinhaService = require('../src/services/caixinhaService');
const movimentacaoService = require('../src/services/movimentacaoService');
const notificacaoService = require('../src/services/notificacaoService');
const transacaoService = require('../src/services/transacaoService');

describe('consistência das caixinhas', () => {
  let usuarioId, c;
  before(async () => {
    await iniciarBanco();
    const admin = await criarAdmin();
    usuarioId = (await criarClienteAtivo(admin, 'Ana')).id;
  });
  after(encerrarBanco);
  beforeEach(async () => {
    await Caixinha.deleteMany({});
    await User.updateOne({ _id: usuarioId }, { saldoCentavos: 10000, status: 'ativo' });
    c = await caixinhaService.criar(usuarioId, { nome: 'Reserva' });
  });
  async function saldos() {
    return [(await User.findById(usuarioId)).saldoCentavos, (await Caixinha.findById(c._id)).saldoCentavos];
  }
  function falharExtrato(t) {
    t.mock.method(transacaoService, 'registrar', async () => {
      throw new Error('extrato indisponível');
    });
  }

  test('aplicação restaura conta e caixinha se o extrato falhar', async (t) => {
    falharExtrato(t);
    await assert.rejects(
      caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 }),
      /extrato indisponível/,
    );
    assert.deepEqual(await saldos(), [10000, 0]);
  });
  test('aplicação devolve o débito se a atualização da caixinha falhar', async (t) => {
    t.mock.method(Caixinha, 'findByIdAndUpdate', async () => {
      throw new Error('caixinha indisponível');
    });
    await assert.rejects(
      caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 }),
      /caixinha indisponível/,
    );
    assert.deepEqual(await saldos(), [10000, 0]);
  });
  test('resgate restaura os dois saldos se o extrato falhar', async (t) => {
    await caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 });
    falharExtrato(t);
    await assert.rejects(
      caixinhaService.resgatar(usuarioId, c._id, { valorCentavos: 500 }),
      /extrato indisponível/,
    );
    assert.deepEqual(await saldos(), [9000, 1000]);
  });
  test('conta bloqueada preserva o saldo da caixinha ao recusar resgate', async () => {
    await caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 });
    await User.updateOne({ _id: usuarioId }, { status: 'bloqueado' });
    await assert.rejects(caixinhaService.resgatar(usuarioId, c._id, { valorCentavos: 500 }), {
      codigo: 'conta_inativa',
    });
    assert.deepEqual(await saldos(), [9000, 1000]);
  });
  test('rendimento falho restaura saldo e juros pendentes', async (t) => {
    await Caixinha.updateOne({ _id: c._id }, { rendimentoPendente: 12.5 });
    falharExtrato(t);
    await assert.rejects(caixinhaService.lancarRendimentos(new Date('2026-11-01')), /extrato indisponível/);
    const atual = await Caixinha.findById(c._id);
    assert.equal(atual.saldoCentavos, 0);
    assert.equal(atual.rendimentoPendente, 12.5);
  });
  test('falha de aviso não desfaz uma aplicação concluída', async (t) => {
    await caixinhaService.atualizar(usuarioId, c._id, { metaCentavos: 1000 });
    t.mock.method(notificacaoService, 'notificar', async () => {
      throw new Error('aviso indisponível');
    });
    t.mock.method(console, 'error', () => {});
    const atual = await caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 });
    assert.ok(atual.metaAtingidaEm);
    assert.deepEqual(await saldos(), [9000, 1000]);
  });
  test('criações simultâneas respeitam o limite por conta', async () => {
    const resultados = await Promise.allSettled(
      Array.from({ length: 10 }, () => caixinhaService.criar(usuarioId, { nome: 'Meta' })),
    );
    assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 5);
    assert.equal(await Caixinha.countDocuments({ usuarioId }), 6);
  });
  test('exclusão aguarda aplicação e devolve todo o saldo', async () => {
    await Promise.all([
      caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 1000 }),
      caixinhaService.excluir(usuarioId, c._id),
    ]);
    assert.equal(await Caixinha.findById(c._id), null);
    assert.equal((await User.findById(usuarioId)).saldoCentavos, 10000);
  });
  test('débito aguarda o extrato de um resgate que falha', async (t) => {
    await caixinhaService.aplicar(usuarioId, c._id, { valorCentavos: 10000 });
    let iniciou: () => void, rejeitar: (e: Error) => void;
    const iniciado = new Promise<void>((resolve) => {
      iniciou = resolve;
    });
    const registro = new Promise((resolve, reject) => {
      rejeitar = reject;
    });
    t.mock.method(transacaoService, 'registrar', () => {
      iniciou();
      return registro;
    });
    const resgate = assert.rejects(
      caixinhaService.resgatar(usuarioId, c._id, { valorCentavos: 500 }),
      /extrato indisponível/,
    );
    await iniciado;
    const debito = assert.rejects(movimentacaoService.debitarConta(usuarioId, 500), {
      codigo: 'saldo_insuficiente',
    });
    rejeitar(new Error('extrato indisponível'));
    await Promise.all([resgate, debito]);
    assert.deepEqual(await saldos(), [0, 10000]);
  });
});
