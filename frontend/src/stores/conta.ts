import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from '../api/admin';
import { contaApi } from '../api/conta';

export const useContaStore = defineStore('conta', () => {
  const resumo = ref(null);
  const dataSistema = ref(null);
  let emAndamento: Promise<void> | null = null;
  let usuarioId: string | null = null;
  let versao = 0;

  async function buscar(user, atual: number) {
    const admin = user.perfil === 'admin';
    const dados = await (admin ? adminApi.obterConfig() : contaApi.resumo());
    if (atual !== versao) return;
    if (!admin) resumo.value = dados;
    dataSistema.value = dados.dataSistema;
  }

  function atualizar(user) {
    if (!user || user.status !== 'ativo') return Promise.resolve();
    if (usuarioId !== user.id) {
      limpar();
      usuarioId = user.id;
    }
    if (!emAndamento) {
      const atual = versao;
      emAndamento = buscar(user, atual).finally(() => {
        if (atual === versao) emAndamento = null;
      });
    }
    return emAndamento;
  }

  function limpar() {
    versao++;
    emAndamento = null;
    usuarioId = null;
    resumo.value = null;
    dataSistema.value = null;
  }

  return { resumo, dataSistema, atualizar, limpar };
});
