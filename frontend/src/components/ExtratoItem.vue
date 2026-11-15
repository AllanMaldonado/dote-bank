<template>
  <v-list-item :to="to" class="dote-extrato-item py-3">
    <template #prepend>
      <v-avatar :color="estilo.avatar" size="40" rounded="sm" class="mr-3">
        <v-icon :icon="icone || estilo.icone" :color="estilo.iconeCor" size="20" />
      </v-avatar>
    </template>

    <v-list-item-title class="text-body-1">{{ titulo }}</v-list-item-title>
    <v-list-item-subtitle class="text-muted">
      <v-chip v-if="falhou" size="x-small" color="surface-bright" class="text-error mr-1">não enviado</v-chip
      >{{ detalhe }}
    </v-list-item-subtitle>

    <template #append>
      <span class="dote-num text-body-1 dote-valor" :class="falhou ? 'text-muted dote-riscado' : estilo.texto">
        {{ formatMoney(valorCentavos, { sinal: tipo !== 'interno' }) }}
      </span>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatMoney } from '../utils/formatMoney';

const props = defineProps({
  tipo: { type: String, required: true, validator: (v) => ['entrada', 'saida', 'interno'].includes(String(v)) },
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  data: { type: String, default: '' },
  valorCentavos: { type: Number, required: true },
  icone: { type: String, default: '' },
  to: { type: [String, Object], default: undefined },
  falhou: { type: Boolean, default: false },
});

const ESTILOS = {
  entrada: { avatar: 'neon-950', icone: 'mdi-arrow-bottom-left', iconeCor: 'primary', texto: 'text-success' },
  saida: { avatar: 'surface-bright', icone: 'mdi-arrow-top-right', iconeCor: 'error', texto: 'text-error' },
  interno: { avatar: 'surface-bright', icone: 'mdi-piggy-bank-outline', iconeCor: 'neon-600', texto: 'text-muted' },
};

const estilo = computed(() => ESTILOS[props.tipo]);
const detalhe = computed(() => [props.subtitulo, props.data].filter(Boolean).join(' · '));
</script>

<style scoped>
.dote-valor {
  padding-left: 12px;
  white-space: nowrap;
}
.dote-riscado {
  text-decoration: line-through;
}
.dote-extrato-item + .dote-extrato-item {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
</style>
