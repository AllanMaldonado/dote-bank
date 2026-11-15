import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';


const vite = await createServer({
  configFile: false,
  envFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => vite.close());
const { useAcao } = await vite.ssrLoadModule('/src/composables/useAcao.ts');
const { useListaPaginada } = await vite.ssrLoadModule('/src/composables/useListaPaginada.ts');
const { useContaStore } = await vite.ssrLoadModule('/src/stores/conta.ts');
const { contaApi } = await vite.ssrLoadModule('/src/api/conta.ts');
const { celular } = await vite.ssrLoadModule('/src/utils/regrasForm.ts');
const { rotasAnteriores } = await vite.ssrLoadModule('/src/router/compatibilidade.ts');
const { alvoDoRelogio } = await vite.ssrLoadModule('/src/utils/datas.ts');
const { adminApi } = await vite.ssrLoadModule('/src/api/admin.ts');
const { http } = await vite.ssrLoadModule('/src/api/http.ts');

test('avançar o relógio permite esperar até 60 segundos pela API', async (t) => {
  const post = t.mock.method(http, 'post', async () => ({ config: {} }));
  await adminApi.avancarRelogio({ ate: '2026-12-05' });
  assert.deepEqual(post.mock.calls[0].arguments, [
    '/admin/relogio/avancar', { ate: '2026-12-05' }, { timeout: 60_000 },
  ]);
});

test('o destino do relógio usa a data exibida e respeita o último dia do mês', () => {
  assert.equal(alvoDoRelogio('2026-11-05T00:00:00.000Z', { meses: 1 }), '2026-12-05');
  assert.equal(alvoDoRelogio('2026-01-31T00:00:00.000Z', { meses: 1 }), '2026-02-28');
  assert.equal(alvoDoRelogio('2028-01-31T00:00:00.000Z', { meses: 1 }), '2028-02-29');
  assert.equal(alvoDoRelogio('2026-12-31T00:00:00.000Z', { dias: 7 }), '2027-01-07');
  assert.equal(alvoDoRelogio('2026-12-31T00:00:00.000Z', { meses: 1 }), '2027-01-31');
  assert.equal(alvoDoRelogio('2026-11-05T00:00:00.000Z', { ate: '2026-11-12' }), '2026-11-12');
});
function pendente() {
  let resolve, reject;
  const promise = new Promise((ok, erro) => {
    resolve = ok;
    reject = erro;
  });
  return { promise, resolve, reject };
}

test('carregamento permanece ativo até todas as ações terminarem', async () => {
  const acao = useAcao(),
    a = pendente(),
    b = pendente();
  const primeira = acao.executar(() => a.promise),
    segunda = acao.executar(() => b.promise);
  b.resolve('ok');
  await segunda;
  assert.equal(acao.carregando.value, true);
  a.resolve('ok');
  await primeira;
  assert.equal(acao.carregando.value, false);
});
test('falha antiga não sobrescreve o resultado da ação mais recente', async () => {
  const acao = useAcao(),
    a = pendente();
  const primeira = acao.executar(() => a.promise);
  await acao.executar(async () => 'ok');
  a.reject(new Error('antiga'));
  await primeira;
  assert.equal(acao.erro.value, '');
});
test('exceção sem objeto Error produz mensagem legível', async () => {
  const acao = useAcao();
  await acao.executar(async () => {
    throw null;
  });
  assert.equal(acao.erro.value, 'Algo deu errado.');
});
test('respostas fora de ordem preservam a página mais recente', async () => {
  const antiga = pendente();
  const lista = useListaPaginada(5, (p) =>
    p === 1 ? antiga.promise : Promise.resolve({ itens: ['nova'], total: 10 }),
  );
  const primeira = lista.buscar(1);
  await lista.buscar(2);
  antiga.resolve({ itens: ['antiga'], total: 5 });
  await primeira;
  assert.deepEqual(lista.itens.value, ['nova']);
  assert.equal(lista.pagina.value, 2);
  assert.equal(lista.total.value, 10);
});
test('página que deixou de existir volta à última página disponível', async () => {
  const pedidos = [];
  const lista = useListaPaginada(5, async (p) => {
    pedidos.push(p);
    return { itens: p === 1 ? ['item'] : [], total: 1 };
  });
  await lista.buscar(3);
  assert.deepEqual(pedidos, [3, 1]);
  assert.equal(lista.pagina.value, 1);
  assert.deepEqual(lista.itens.value, ['item']);
});
test('resposta da sessão anterior não altera a conta atual', async (t) => {
  setActivePinia(createPinia());
  const antiga = pendente();
  let chamadas = 0;
  t.mock.method(contaApi, 'resumo', () =>
    ++chamadas === 1 ? antiga.promise : Promise.resolve({ saldoCentavos: 200, dataSistema: 'nova' }),
  );
  const conta = useContaStore();
  const primeira = conta.atualizar({ id: 'ana', status: 'ativo', perfil: 'cliente' });
  conta.limpar();
  await conta.atualizar({ id: 'bruno', status: 'ativo', perfil: 'cliente' });
  antiga.resolve({ saldoCentavos: 999, dataSistema: 'antiga' });
  await primeira;
  assert.equal(conta.resumo.saldoCentavos, 200);
  assert.equal(conta.dataSistema, 'nova');
});
test('consultas simultâneas da mesma conta compartilham a requisição', async (t) => {
  setActivePinia(createPinia());
  const resposta = pendente();
  const mock = t.mock.method(contaApi, 'resumo', () => resposta.promise);
  const conta = useContaStore(),
    user = { id: 'ana', status: 'ativo', perfil: 'cliente' };
  const a = conta.atualizar(user),
    b = conta.atualizar(user);
  assert.equal(mock.mock.callCount(), 1);
  resposta.resolve({ saldoCentavos: 10, dataSistema: 'hoje' });
  await Promise.all([a, b]);
});
test('celular aceita o mesmo formato exigido pela API', () => {
  assert.equal(celular('(18) 99999-9999'), true);
  assert.equal(celular(''), true);
  assert.notEqual(celular('1833334444'), true);
  assert.notEqual(celular('00999999999'), true);
});

test('links anteriores abrem transferências e preservam query e hash', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...rotasAnteriores, { path: '/transferencias/:resto(.*)*', component: {} }],
  });
  const prefixo = rotasAnteriores[0].path.split('/:')[0];
  await router.push({ path: prefixo + '/chaves', query: { chave: 'teste' }, hash: '#agendados' });
  assert.equal(router.currentRoute.value.path, '/transferencias/chaves');
  assert.deepEqual(router.currentRoute.value.query, { chave: 'teste' });
  assert.equal(router.currentRoute.value.hash, '#agendados');
  await router.push(prefixo);
  assert.equal(router.currentRoute.value.path, '/transferencias');
});
