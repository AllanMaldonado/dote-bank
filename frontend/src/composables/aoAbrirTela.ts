import { onActivated, onMounted, ref } from 'vue';

export function aoAbrirTela(carregar) {
  const pronto = ref(false);
  const rodar = async () => {
    await carregar();
    pronto.value = true;
  };
  let primeiraAtivacao = true;
  onMounted(rodar);
  onActivated(() => {
    if (primeiraAtivacao) primeiraAtivacao = false;
    else rodar();
  });
  return pronto;
}
