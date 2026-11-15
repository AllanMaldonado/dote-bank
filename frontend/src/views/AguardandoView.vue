<template>
  <div class="dote-entrada">
    <v-card class="pa-8 text-center">
      <MarcaDote :altura="34" class="mx-auto mb-5" />
      <v-icon icon="mdi-timer-sand" size="40" color="warning" class="mb-3" />
      <h1 class="dote-title mb-2">&gt; conta em análise<span class="dote-cursor" /></h1>
      <p class="text-muted mb-6">
        Olá, {{ primeiroNome }}! Seu cadastro está na fila de aprovação do DOTE. Quando for aprovado, sua conta já
        começa com <span class="text-neon-300">P$ 1.000</span>.
      </p>
      <AlertaErro :mensagem="erro" class="mb-4" />
      <v-btn color="primary" class="dote-cta" block :loading="carregando" @click="verificar">Verificar de novo</v-btn>
      <v-btn variant="text" color="muted" block class="mt-2" @click="encerrar">Sair</v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAcao } from '../composables/useAcao';
import { rotaInicial, useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';

const auth = useAuthStore();
const contaStore = useContaStore();
const router = useRouter();
const primeiroNome = computed(() => auth.user?.nome?.split(' ')[0] ?? '');
const { carregando, erro, executar } = useAcao();

async function verificar() {
  const u = await executar(auth.recarregar);
  if (u && u.status !== 'pendente') router.push(rotaInicial(u));
}

async function encerrar() {
  await auth.logout();
  contaStore.limpar();
  router.push('/login');
}
</script>
