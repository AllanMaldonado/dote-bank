<template>
  <v-btn
    icon
    variant="text"
    aria-haspopup="dialog"
    @click="$emit('abrir')"
    :aria-label="naoLidas ? `Diamante: ${naoLidas} avisos não lidos` : 'Avisos do Diamante'"
  >
    <v-badge
      :model-value="naoLidas > 0"
      :content="naoLidas > 99 ? '99+' : naoLidas"
      :color="sobreNeon ? 'background' : 'primary'"
      offset-x="-4"
      offset-y="-2"
    >
      <DiamanteMascote :tamanho="30" :alerta="naoLidas > 0" :sobre-neon="sobreNeon" />
    </v-badge>
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useContaStore } from '../stores/conta';
import DiamanteMascote from './DiamanteMascote.vue';

defineProps({ sobreNeon: { type: Boolean, default: false } });
defineEmits(['abrir']);
const contaStore = useContaStore();
const naoLidas = computed(() => contaStore.resumo?.notificacoesNaoLidas ?? 0);
</script>
