<template>
  <v-text-field
    v-model="texto"
    :label="label"
    :prefix="SIMBOLO_PONTOS"
    inputmode="decimal"
    placeholder="0,00"
    :error-messages="invalido ? 'Use um valor como 120,50' : undefined"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { centavosParaTexto, paraCentavos } from '../utils/centavos';
import { SIMBOLO_PONTOS } from '../utils/formatMoney';

const centavos = defineModel({ type: Number, default: null });
defineProps({ label: { type: String, default: 'Valor' } });

const texto = ref(centavosParaTexto(centavos.value));
const invalido = computed(() => texto.value !== '' && paraCentavos(texto.value) === null);

watch(texto, (t) => (centavos.value = paraCentavos(t)));
watch(centavos, (c) => {
  if (c !== paraCentavos(texto.value)) texto.value = centavosParaTexto(c);
});
</script>
