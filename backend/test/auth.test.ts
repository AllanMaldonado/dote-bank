const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');
const {
  agenteComToken,
  app,
  criarAdmin,
  dadosCliente,
  encerrarBanco,
  iniciarBanco,
  logar,
  request,
  ultimoLinkReset,
} = require('./helpers');

describe('autenticação, aprovação e redefinição de senha', () => {
  let admin;
  before(async () => {
    await iniciarBanco();
    admin = await criarAdmin();
  });
  after(encerrarBanco);

  test('rotas protegidas: 401 sem Bearer, com Bearer inválido e com esquema errado', async () => {
    const semToken = await request(app).get('/api/conta').expect(401);
    assert.equal(semToken.body.codigo, 'nao_autenticado');
    await request(app).get('/api/admin/clientes').expect(401);
    await request(app).get('/api/auth/me').expect(401);

    const invalido = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .expect(401);
    assert.equal(invalido.body.codigo, 'nao_autenticado');
    await request(app).get('/api/auth/me').set('Authorization', 'Basic abc').expect(401);
  });

  test('erros seguem o formato { message, codigo } (e detalhes na validação)', async () => {
    const naoExiste = await request(app).get('/api/nao-existe').expect(404);
    assert.equal(naoExiste.body.codigo, 'rota_nao_encontrada');
    assert.equal(typeof naoExiste.body.message, 'string');
    assert.equal(naoExiste.body.erro, undefined);

    const r = await request(app)
      .post('/api/auth/register')
      .send(dadosCliente('Sem Email', { email: 'x' }))
      .expect(400);
    assert.equal(r.body.codigo, 'validacao');
    assert.equal(typeof r.body.message, 'string');
    assert.ok(r.body.detalhes.some((d) => d.campo === 'email' && d.mensagem));
  });

  test('cadastro valida CPF, e-mail e senha (mínimo 8)', async () => {
    const r = await request(app)
      .post('/api/auth/register')
      .send(dadosCliente('Inválido', { cpf: '12345678900' }))
      .expect(400);
    assert.match(r.body.message, /CPF/);
    await request(app)
      .post('/api/auth/register')
      .send(dadosCliente('Inválido2', { email: 'x' }))
      .expect(400);
    await request(app)
      .post('/api/auth/register')
      .send(dadosCliente('Inválido3', { senha: '1234567' }))
      .expect(400);
    await request(app)
      .post('/api/auth/register')
      .send(dadosCliente('Inválido4', { celular: '123' }))
      .expect(400);
  });

  test('fluxo completo: pendente → aprovado com P$ 1.000 → logout → reset de senha', async () => {
    const dados = dadosCliente('Ana Souza');
    const cad = await request(app).post('/api/auth/register').send(dados).expect(201);
    assert.equal(cad.body.user.status, 'pendente');
    assert.equal(cad.body.user.agencia, '0001');
    assert.match(cad.body.user.conta, /^\d{6}-\d$/);
    assert.equal(cad.body.user.senha, undefined);
    assert.ok(cad.body.token);
    assert.ok(cad.body.message);

    await request(app).post('/api/auth/register').send(dados).expect(409);

    const pendente = agenteComToken(cad.body.token);
    const eu = await pendente.get('/api/auth/me').expect(200);
    assert.equal(eu.body.user.email, dados.email);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: dados.email, senha: dados.senha })
      .expect(200);
    assert.equal(login.body.user.status, 'pendente');
    assert.ok(login.body.token);
    assert.equal(JSON.stringify(login.body).includes('"senha"'), false);
    const ana = agenteComToken(login.body.token);
    const pend = await ana.get('/api/conta').expect(403);
    assert.equal(pend.body.codigo, 'conta_pendente');

    await ana.get('/api/admin/clientes').expect(403);

    const fila = await admin.get('/api/admin/clientes?status=pendente').expect(200);
    assert.equal(fila.body.itens.length, 1);
    const aprovado = await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(200);
    assert.equal(aprovado.body.status, 'ativo');
    assert.equal(aprovado.body.saldoCentavos, 100000);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(422);

    const conta = await ana.get('/api/conta').expect(200);
    assert.equal(conta.body.saldoCentavos, 100000);
    const extrato = await ana.get('/api/transacoes').expect(200);
    assert.equal(extrato.body.itens[0].tipo, 'deposito_inicial');
    assert.equal(extrato.body.itens[0].direcao, 'entrada');
    const notifs = await ana.get('/api/notificacoes').expect(200);
    assert.equal(notifs.body.itens[0].tipo, 'conta_aprovada');

    const errada = await request(app).post('/api/auth/login').send({ email: dados.email, senha: 'outra' }).expect(401);
    const inexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao@existe.dev', senha: 'outra' })
      .expect(401);
    assert.equal(errada.body.message, inexistente.body.message);
    assert.equal(errada.body.codigo, 'credenciais_invalidas');

    await request(app).post('/api/auth/forgot-password').send({ email: 'nao@existe.dev' }).expect(200);
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: dados.email }).expect(200);
    assert.ok(forgot.body.message);
    const tokenReset = new URL(ultimoLinkReset()).searchParams.get('token');
    assert.ok(tokenReset);

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalido', novaSenha: 'novaSenha1' })
      .expect(400);
    await request(app).post('/api/auth/reset-password').send({ token: tokenReset, novaSenha: 'curta' }).expect(400);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenReset, novaSenha: 'novaSenha1' })
      .expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenReset, novaSenha: 'outraSenha2' })
      .expect(400);

    await ana.get('/api/conta').expect(401);
    await request(app).post('/api/auth/login').send({ email: dados.email, senha: dados.senha }).expect(401);
    await request(app).post('/api/auth/login').send({ email: dados.email, senha: 'novaSenha1' }).expect(200);
  });

  test('logout invalida o token no servidor, mesmo se alguém guardou o JWT', async () => {
    const dados = dadosCliente('Diego Rocha');
    const cad = await request(app).post('/api/auth/register').send(dados).expect(201);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(200);
    const diego = await logar(dados);
    await diego.get('/api/conta').expect(200);

    await diego.post('/api/auth/logout').expect(204);
    await diego.get('/api/auth/me').expect(401);
    await diego.get('/api/conta').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${diego.token}`).expect(401);

    const novo = await logar(dados);
    await novo.get('/api/auth/me').expect(200);
  });

  test('troca de senha: exige a senha atual, devolve token novo e derruba o antigo', async () => {
    const dados = dadosCliente('Elisa Prado');
    const cad = await request(app).post('/api/auth/register').send(dados).expect(201);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(200);
    const elisa = await logar(dados);

    const errada = await elisa
      .put('/api/conta/senha')
      .send({ senhaAtual: 'errada123', novaSenha: 'novaSenha99' })
      .expect(400);
    assert.equal(errada.body.codigo, 'senha_atual_incorreta');
    await elisa.put('/api/conta/senha').send({ senhaAtual: dados.senha, novaSenha: '123' }).expect(400);
    await elisa.put('/api/conta/senha').send({ novaSenha: 'novaSenha99' }).expect(400);

    const r = await elisa
      .put('/api/conta/senha')
      .send({ senhaAtual: dados.senha, novaSenha: 'novaSenha99' })
      .expect(200);
    assert.ok(r.body.token);
    assert.equal(r.body.user.email, dados.email);
    assert.ok(r.body.message);
    assert.equal(JSON.stringify(r.body).includes('"senha"'), false);

    await elisa.get('/api/conta').expect(401);
    await agenteComToken(r.body.token).get('/api/conta').expect(200);

    await request(app).post('/api/auth/login').send({ email: dados.email, senha: dados.senha }).expect(401);
    await request(app).post('/api/auth/login').send({ email: dados.email, senha: 'novaSenha99' }).expect(200);
  });

  test('bloqueio derruba a sessão e impede login; desbloqueio devolve o acesso', async () => {
    const dados = dadosCliente('Bruno Lima');
    const cad = await request(app).post('/api/auth/register').send(dados).expect(201);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(200);
    const bruno = await logar(dados);

    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/bloquear`).expect(200);
    await bruno.get('/api/conta').expect(401);
    const r = await request(app).post('/api/auth/login').send({ email: dados.email, senha: dados.senha }).expect(403);
    assert.equal(r.body.codigo, 'conta_bloqueada');

    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/desbloquear`).expect(200);
    const depois = await logar(dados);
    await depois.get('/api/conta').expect(200);
  });

  test('cliente edita o próprio perfil (nome e celular)', async () => {
    const dados = dadosCliente('Carla Dias');
    const cad = await request(app).post('/api/auth/register').send(dados).expect(201);
    await admin.patch(`/api/admin/clientes/${cad.body.user.id}/aprovar`).expect(200);
    const carla = await logar(dados);
    const r = await carla.patch('/api/conta/perfil').send({ nome: 'Carla D.', celular: '(18) 99876-5432' }).expect(200);
    assert.equal(r.body.user.nome, 'Carla D.');
    assert.equal(r.body.user.celular, '18998765432');
    await carla.patch('/api/conta/perfil').send({ celular: '123' }).expect(400);
  });
});
