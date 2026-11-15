<template>
  <v-btn
    color="primary"
    class="dote-cta dote-diamante-analise"
    prepend-icon="mdi-creation-outline"
    :loading="analisando"
    @click="analisar"
  >
    {{ analise ? 'Nova análise' : 'Pedir análise' }}
  </v-btn>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { relatorioApi } from '../api/relatorio';
import { useAcao } from '../composables/useAcao';

const analise = defineModel('analise', { type: Object, default: null });
const erroAnalise = defineModel('erro', { type: String, default: '' });
const { carregando: analisando, erro, executar } = useAcao();
watch(erro, (e) => (erroAnalise.value = e));

async function analisar() {
  erroAnalise.value = '';
  const resultado = await executar(() => relatorioApi.analisar({}));
  if (resultado) analise.value = resultado;
}
</script>
