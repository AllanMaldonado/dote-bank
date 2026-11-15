<template>
  <v-dialog v-model="aberto" max-width="820" aria-labelledby="titulo-diamante">
    <v-card class="dote-diamante-modal">
      <div class="dote-diamante-topo">
        <DiamanteMascote :tamanho="40" :alerta="naoLidas > 0" />
        <div class="flex-grow-1">
          <h2 id="titulo-diamante" class="dote-subtitulo">Diamante</h2>
          <div class="text-muted text-body-2">{{ analise ? 'Minha análise do seu dinheiro' : 'Seus avisos' }}</div>
        </div>
        <DiamanteAnalise v-model:analise="analise" v-model:erro="erroAnalise" />
        <v-btn icon="mdi-close" variant="text" aria-label="Fechar o Diamante" @click="aberto = false" />
      </div>

      <div class="dote-diamante-corpo">
        <Transition name="dote-revelar" mode="out-in">
          <DiamanteResultado v-if="analise" :analise="analise" @voltar="analise = null" />
          <NotificacoesView v-else-if="aberto" @navegar="aberto = false" />
        </Transition>
      </div>

      <v-alert v-if="erroAnalise" type="error" variant="tonal" density="compact" class="mx-5 mb-4">
        {{ erroAnalise }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useContaStore } from '../stores/conta';
import NotificacoesView from '../views/NotificacoesView.vue';
import DiamanteAnalise from './DiamanteAnalise.vue';
import DiamanteMascote from './DiamanteMascote.vue';
import DiamanteResultado from './DiamanteResultado.vue';

const aberto = defineModel({ type: Boolean, default: false });
const analise = ref(null);
const erroAnalise = ref('');
const naoLidas = computed(() => useContaStore().resumo?.notificacoesNaoLidas ?? 0);

watch(aberto, (visivel) => {
  if (visivel) {
    analise.value = null;
    erroAnalise.value = '';
  }
});
</script>

<style scoped>
.dote-diamante-topo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 12px 12px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.dote-diamante-modal.v-card {
  overflow: visible;  
}
.dote-diamante-corpo {
  padding: 16px 20px;
}
</style>
