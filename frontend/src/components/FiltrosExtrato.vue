<template>
  <div class="dote-filtros">
    <v-text-field
      v-if="comBusca"
      v-model="busca"
      placeholder="Buscar descrição"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      density="compact"
      maxlength="80"
      class="dote-filtro-busca"
      aria-label="Buscar na descrição"
      @keyup.enter="$emit('aplicar')"
      @click:clear="limparBusca"
    />
    <FiltroCategoria v-model="categoria" :desabilitado="carregando" />
    <SeletorPeriodo v-model="datas" :maximo="dataMaxima" :rotulo-vazio="rotuloPeriodo" :desabilitado="carregando" />
    <v-btn
      icon="mdi-filter-outline"
      color="neon-950"
      class="dote-filtro-aplicar"
      aria-label="Aplicar filtros"
      title="Aplicar filtros"
      :loading="carregando"
      :disabled="desabilitado"
      @click="$emit('aplicar')"
    />
    <div v-if="$slots.meio" class="dote-filtros-meio"><slot name="meio" /></div>
    <div v-if="$slots.acoes" class="dote-filtros-acoes"><slot name="acoes" /></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue';
import FiltroCategoria from './FiltroCategoria.vue';
import SeletorPeriodo from './SeletorPeriodo.vue';

defineProps({
  carregando: Boolean,
  desabilitado: Boolean,
  dataMaxima: String,
  comBusca: Boolean,
  rotuloPeriodo: { type: String, default: 'Todo o período' },
});
const emit = defineEmits(['aplicar']);
const busca = defineModel('busca', { type: String, default: '' });
const categoria = defineModel('categoria', { type: String, default: null });
const datas = defineModel<string[]>('datas', { default: () => [] });

async function limparBusca() {
  busca.value = '';
  await nextTick();
  emit('aplicar');
}
</script>

<style scoped>
.dote-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.dote-filtro-busca {
  flex: 0 1 210px;
  min-width: 160px;
}
.dote-filtro-busca :deep(.v-field) {
  height: 40px;
}
.dote-filtro-aplicar.v-btn {
  width: 40px;
  height: 40px;
  border-radius: 6px;
}
.dote-filtros-meio {
  flex: 1 1 0;
  min-width: max-content;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding-inline: 8px;
}
.dote-filtros-acoes {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
@media (max-width: 600px) {
  .dote-filtro-busca {
    flex: 1 1 100%;
  }
  .dote-filtros-meio {
    flex: 1 1 100%;
    justify-content: flex-start;
    padding-inline: 0;
  }
  .dote-filtros-acoes {
    flex: 1 1 100%;
    margin-left: 0;
  }
  .dote-filtros-acoes > :deep(*) {
    flex: 1;
  }
}
</style>
