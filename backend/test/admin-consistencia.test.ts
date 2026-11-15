const assert = require('node:assert/strict');
const { before, after, describe, test } = require('node:test');
const { iniciarBanco, encerrarBanco, dadosCliente } = require('./helpers');
const User = require('../src/models/User');
const authService = require('../src/services/authService');
const adminService = require('../src/services/adminService');
const transacaoService = require('../src/services/transacaoService');
const notificacaoService = require('../src/services/notificacaoService');

describe('consistência da aprovação', () => {
  before(iniciarBanco);
  after(encerrarBanco);
  test('falha no depósito inicial devolve a conta ao estado pendente', async (t) => {
    const { user } = await authService.register(dadosCliente('Ana'));
    const mock = t.mock.method(transacaoService, 'registrar', async () => {
      throw new Error('extrato indisponível');
    });
    await assert.rejects(adminService.aprovar(user._id), /extrato indisponível/);
    const atual = await User.findById(user._id);
    assert.equal(atual.status, 'pendente');
    assert.equal(atual.saldoCentavos, 0);
    assert.equal(atual.aprovadoEm, undefined);
    mock.mock.restore();
    assert.equal((await adminService.aprovar(user._id)).saldoCentavos, 100000);
  });
  test('aviso indisponível não invalida aprovação concluída', async (t) => {
    const { user } = await authService.register(dadosCliente('Bruno'));
    t.mock.method(notificacaoService, 'notificar', async () => {
      throw new Error('aviso indisponível');
    });
    t.mock.method(console, 'error', () => {});
    const atual = await adminService.aprovar(user._id);
    assert.equal(atual.status, 'ativo');
    assert.equal(atual.saldoCentavos, 100000);
  });
});
