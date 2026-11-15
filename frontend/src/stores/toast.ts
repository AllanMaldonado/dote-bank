import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const aberto = ref(false);
  const texto = ref('');
  const tipo = ref('success');
  const duracao = ref(3000);

  function mostrar(novoTexto, novoTipo = 'success', novaDuracao = 3000) {
    texto.value = novoTexto;
    tipo.value = novoTipo;
    duracao.value = novaDuracao;
    aberto.value = true;
  }

  return { aberto, texto, tipo, duracao, mostrar };
});
