import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '../api/auth';
import { useContaStore } from './conta';
import { clearToken, getToken, setToken } from '../api/token';

export function rotaInicial(user) {
  if (!user) return '/login';
  if (user.perfil === 'admin') return '/admin';
  if (user.status === 'pendente') return '/aguardando';
  return '/inicio';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(null);
  const carregada = ref(false);

  function setUser(novo) {
    user.value = novo;
  }

  function setSessao(novoToken, novoUser) {
    token.value = novoToken;
    user.value = novoUser;
    carregada.value = true;
    setToken(novoToken);
  }

  function limparLocal() {
    useContaStore().limpar();
    user.value = null;
    token.value = null;
    clearToken();
  }

  async function restaurar() {
    if (carregada.value) return user.value;
    token.value = getToken();
    if (token.value) {
      try {
        user.value = (await authApi.me()).user;
      } catch {
        limparLocal();
      }
    }
    carregada.value = true;
    return user.value;
  }

  async function login(email, senha) {
    const r = await authApi.login(email, senha);
    setSessao(r.token, r.user);
    return r.user;
  }

  async function register(dados) {
    const r = await authApi.register(dados);
    setSessao(r.token, r.user);
    return r.user;
  }

  async function recarregar() {
    user.value = (await authApi.me()).user;
    return user.value;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      limparLocal();
    }
  }

  return { user, token, carregada, setUser, setSessao, limparLocal, restaurar, login, register, recarregar, logout };
});
