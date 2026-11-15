const assert = require('node:assert/strict');
const { before, after, describe, test } = require('node:test');
const { iniciarBanco, encerrarBanco, criarAdmin, criarClienteAtivo } = require('./helpers');
const Transacao = require('../src/models/Transacao');
const Notificacao = require('../src/models/Notificacao');
const ChaveTransferencia = require('../src/models/ChaveTransferencia');
const { prefixoAnterior, tiposTransferencia, tiposNotificacaoAnteriores } = require('../src/utils/compatibilidadeTransferencias');

describe('transferências e dados anteriores', () => {
  let admin, ana, bruno;
  before(async () => {
    await iniciarBanco();
    admin = await criarAdmin();
    ana = await criarClienteAtivo(admin, 'Ana');
    bruno = await criarClienteAtivo(admin, 'Bruno');
    await ChaveTransferencia.create({ usuarioId: bruno.id, tipo: 'email', valor: bruno.dados.email });
  });
  after(encerrarBanco);

  test('chaves anteriores continuam disponíveis na rota nova', async () => {
    const resposta = await ana.agente.get('/api/transferencias/destinatario').query({ chave: bruno.dados.email }).expect(200);
    assert.equal(resposta.body.nome, 'Bruno');
  });

  test('novas transferências usam a rota e o tipo novos', async () => {
    const r = await ana.agente.post('/api/transferencias').send({ chave: bruno.dados.email, valorCentavos: 100 }).expect(201);
    assert.equal(r.body.tipo, 'transferencia');
    assert.equal((await Transacao.findById(r.body.id)).tipo, 'transferencia');
  });

  test('rotas anteriores continuam passando pela validação', async () => {
    await ana.agente.post('/api' + prefixoAnterior + '/transferencias').send({ chave: bruno.dados.email, valorCentavos: -100 }).expect(400);
    const r = await ana.agente.post('/api' + prefixoAnterior + '/transferencias').send({ chave: bruno.dados.email, valorCentavos: 100 }).expect(201);
    assert.equal(r.body.tipo, 'transferencia');
  });

  test('extrato e painel incluem os tipos persistidos anteriormente', async () => {
    const t = await Transacao.create({ codigo: 'LEGADO-TESTE', tipo: tiposTransferencia[1], origemId: ana.id, destinoId: bruno.id, valorCentavos: 200, data: new Date('2026-01-05') });
    const extrato = await ana.agente.get('/api/transacoes').expect(200);
    assert.equal(extrato.body.itens.find((item) => item.id === String(t._id)).tipo, 'transferencia');
    const painel = await admin.get('/api/admin/painel').expect(200);
    assert.equal(painel.body.transferencias.quantidade, 3);
    assert.equal(painel.body.transferencias.volumeCentavos, 400);
  });

  test('notificações antigas recebem tipo e link atualizados na resposta', async () => {
    const n = await Notificacao.create({ usuarioId: ana.id, tipo: tiposNotificacaoAnteriores[0], titulo: 'Aviso anterior', mensagem: 'Transferência de demonstração', link: prefixoAnterior + '/agendamentos', data: new Date() });
    const resposta = await ana.agente.get('/api/notificacoes').expect(200);
    const aviso = resposta.body.itens.find((item) => item.id === String(n._id));
    assert.equal(aviso.tipo, 'transferencia_recebida');
    assert.equal(aviso.link, '/transferencias/agendamentos');
    await ana.agente.patch('/api/notificacoes/' + n._id + '/lida').expect(200);
  });
});
