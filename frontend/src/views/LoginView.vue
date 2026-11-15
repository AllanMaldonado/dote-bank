<template>
  <div class="dote-entrada">
    <v-card class="pa-8">
      <div class="dote-label">banco digital de pontos</div>
      <h1 class="dote-logo"><MarcaDote variante="completo" :altura="40" alt="DOTE" /></h1>

      <v-alert v-if="aviso" type="info" variant="tonal" density="compact" class="mb-4">{{ aviso }}</v-alert>
      <AlertaErro :mensagem="erro" class="mb-4" />

      <v-form id="login-form" validate-on="submit" @submit.prevent="enviar">
        <v-text-field
          id="login-email"
          v-model="email"
          name="email"
          label="E-mail"
          type="email"
          autocomplete="username"
          :rules="[obrigatorio, emailValido]"
          prepend-inner-icon="mdi-email-outline"
        />
        <v-text-field
          id="current-password"
          v-model="senha"
          name="password"
          label="Senha"
          type="password"
          autocomplete="current-password"
          :rules="[obrigatorio]"
          prepend-inner-icon="mdi-lock-outline"
        />
        <v-btn type="submit" color="primary" class="dote-cta" block size="large" :loading="carregando">Entrar</v-btn>
      </v-form>

      <div class="d-flex justify-space-between flex-wrap ga-2 mt-6 text-body-2">
        <router-link to="/" class="text-muted">&larr; início</router-link>
        <router-link to="/cadastro" class="text-neon-600">Abrir conta</router-link>
        <router-link to="/esqueci-senha" class="text-neon-600">Esqueci a senha</router-link>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAcao } from '../composables/useAcao';
import { rotaInicial, useAuthStore } from '../stores/auth';
import { email as emailValido, obrigatorio } from '../utils/regrasForm';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const email = ref('');
const senha = ref('');
const aviso = ref(route.query.aviso ?? '');
const { carregando, erro, executar } = useAcao();

async function enviar(evento) {
  if (!(await evento).valid) return;
  const usuario = await executar(() => auth.login(email.value, senha.value));
  if (!usuario) return;
  const pedido = route.query.volta;
  const volta = usuario.status === 'ativo' && typeof pedido === 'string' && /^\/(?!\/)/.test(pedido) ? pedido : null;
  router.push(volta ?? rotaInicial(usuario));
}
</script>

<style scoped>
.dote-logo {
  font-size: 44px;
  line-height: 1.1;
  letter-spacing: 0.04em;
  margin: 4px 0 28px;
  font-weight: 400;
}
</style>
