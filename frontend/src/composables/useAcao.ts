import { ref } from 'vue';

export function useAcao() {
  const carregando = ref(false);
  const erro = ref('');
  let pendentes = 0;
  let ultima = 0;

  async function executar<T>(fn: () => Promise<T>): Promise<T | undefined> {
    const atual = ++ultima;
    pendentes++;
    carregando.value = true;
    erro.value = '';
    try {
      return await fn();
    } catch (e) {
      if (atual === ultima) erro.value = e instanceof Error ? e.message : 'Algo deu errado.';
      return undefined;
    } finally {
      carregando.value = --pendentes > 0;
    }
  }

  return { carregando, erro, executar };
}
