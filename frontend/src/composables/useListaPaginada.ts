import { computed, ref } from 'vue';
import { useAcao } from './useAcao';

type Pagina<T> = { itens: T[]; total: number };

export function useListaPaginada<T = any>(limite: number, listar: (pagina: number) => Promise<Pagina<T>>) {
  const itens = ref<T[]>([]);
  const total = ref(0);
  const pagina = ref(1);
  const paginas = computed(() => Math.ceil(total.value / limite));
  const acao = useAcao();
  let pedido = 0;

  function buscar(p = pagina.value) {
    pagina.value = p;
    const atual = ++pedido;
    return acao.executar(async () => {
      let resposta = await listar(p);
      if (atual !== pedido) return;
      const ultima = Math.max(1, Math.ceil(resposta.total / limite));
      if (p > ultima) {
        p = ultima;
        resposta = await listar(p);
        if (atual !== pedido) return;
      }
      pagina.value = p;
      itens.value = resposta.itens;
      total.value = resposta.total;
    });
  }

  return { itens, total, pagina, paginas, buscar, ...acao };
}
