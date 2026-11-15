import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { definirAoExpirarSessao } from '../api/http';
import { rotaInicial, useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';

const telas = import.meta.glob<any>(['../views/*View.vue', '!../views/NotificacoesView.vue']);
const v = (nome: string) => telas[`../views/${nome}.vue`];

declare module 'vue-router' {
  interface RouteMeta {
    acesso?: 'landing' | 'publico' | 'pendente' | 'cliente' | 'admin' | 'logado';
    titulo?: string;
    pai?: string;
    inicio?: boolean;
    semTitulo?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: v('LandingView'), meta: { acesso: 'landing', titulo: 'Seu banco digital' } },
  { path: '/login', component: v('LoginView'), meta: { acesso: 'publico', titulo: 'Entrar' } },
  { path: '/cadastro', component: v('CadastroView'), meta: { acesso: 'publico', titulo: 'Abrir conta' } },
  { path: '/esqueci-senha', component: v('EsqueciSenhaView'), meta: { acesso: 'publico', titulo: 'Esqueci a senha' } },
  { path: '/redefinir-senha', component: v('RedefinirSenhaView'), meta: { acesso: 'publico', titulo: 'Nova senha' } },
  { path: '/aguardando', component: v('AguardandoView'), meta: { acesso: 'pendente', titulo: 'Aguardando aprovação' } },

  { path: '/inicio', component: v('HomeView'), meta: { acesso: 'cliente', titulo: 'Início', inicio: true } },
  { path: '/pix', component: v('PixView'), meta: { acesso: 'cliente', titulo: 'Transferências', semTitulo: true } },
  {
    path: '/pix/contatos',
    component: v('ContatosView'),
    meta: { acesso: 'cliente', titulo: 'Contatos', pai: '/pix' },
  },
  { path: '/pix/chaves', component: v('ChavesView'), meta: { acesso: 'cliente', titulo: 'Transferências', pai: '/pix', semTitulo: true } },
  { path: '/extrato', component: v('ExtratoView'), meta: { acesso: 'cliente', titulo: 'Extrato', semTitulo: true } },
  {
    path: '/extrato/relatorio',
    component: v('RelatorioView'),
    meta: { acesso: 'cliente', titulo: 'Extrato', pai: '/extrato', semTitulo: true },
  },
  { path: '/caixinhas', component: v('CaixinhasView'), meta: { acesso: 'cliente', titulo: 'Caixinhas' } },
  { path: '/notificacoes', redirect: { path: '/inicio', query: { avisos: '1' } } },
  { path: '/diamante', redirect: { path: '/inicio', query: { avisos: 'analise' } } },
  { path: '/perfil', component: v('PerfilView'), meta: { acesso: 'cliente', titulo: 'Meu perfil' } },
  { path: '/comprovante/:id', component: v('ComprovanteView'), meta: { acesso: 'logado', titulo: 'Comprovante' } },
  { path: '/caixinhas/:id', redirect: '/caixinhas' },
  { path: '/chaves', redirect: '/pix/chaves' },
  { path: '/recorrencias', redirect: { path: '/pix', hash: '#agendados' } },
  { path: '/pix/agendados', redirect: { path: '/pix', hash: '#agendados' } },
  { path: '/pix/agendamentos', redirect: { path: '/pix', hash: '#agendados' } },
  { path: '/relatorio', redirect: '/extrato/relatorio' },
  { path: '/extrato/calendario', redirect: '/extrato' },
  { path: '/orcamentos', redirect: '/extrato' },

  { path: '/admin', component: v('AdminClientesView'), meta: { acesso: 'admin', titulo: 'Clientes' } },
  { path: '/admin/painel', component: v('AdminPainelView'), meta: { acesso: 'admin', titulo: 'Painel' } },
  { path: '/admin/clientes/:id', component: v('AdminClienteView'), meta: { acesso: 'admin', titulo: 'Cliente' } },
  { path: '/admin/sistema', component: v('AdminSistemaView'), meta: { acesso: 'admin', titulo: 'Sistema' } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, salva) => {
    if (salva) return salva;
    if (to.path === '/pix' && to.hash === '#agendados') return false;
    return { top: 0 };
  },
});

function destinoPermitido(to, usuario) {
  const acesso = to.meta.acesso;
  if (acesso === 'landing') return true;
  if (acesso === 'publico') return usuario ? rotaInicial(usuario) : true;
  if (!usuario) return { path: '/login', query: { volta: to.fullPath } };
  const pendente = usuario.status === 'pendente';
  if (acesso === 'pendente') return pendente ? true : rotaInicial(usuario);
  if (pendente) return '/aguardando';
  if (acesso === 'logado' || acesso === usuario.perfil) return true;
  return rotaInicial(usuario);
}

router.beforeEach(async (to) => destinoPermitido(to, await useAuthStore().restaurar()));

router.afterEach((to) => {
  document.title = to.meta.acesso === 'landing' ? 'DOTE BANK · Seu banco digital' : `${to.meta.titulo ?? 'DOTE'} · DOTE`;
  useContaStore()
    .atualizar(useAuthStore().user)
    .catch(() => {});
});

definirAoExpirarSessao(() => {
  useAuthStore().limparLocal();
  useContaStore().limpar();
  router.push('/login');
});

export default router;
