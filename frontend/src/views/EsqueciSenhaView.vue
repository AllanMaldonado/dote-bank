<template>
  <div class="dote-entrada">
    <v-card class="pa-8">
      <router-link to="/" aria-label="DOTE, início" class="d-inline-block mb-5"
        ><MarcaDote :altura="30"
      /></router-link>
      <h1 class="dote-title mb-1">&gt; esqueci a senha</h1>
      <p class="text-muted text-body-2 mb-6">Enviaremos um link para redefinir, válido por 15 minutos.</p>

      <v-alert v-if="mensagem" type="success" variant="tonal" density="compact" class="mb-4">{{ mensagem }}</v-alert>
      <AlertaErro :mensagem="erro" class="mb-4" />

      <v-form v-if="!mensagem" validate-on="submit" @submit.prevent="enviar">
        <v-text-field
          v-model="email"
          label="E-mail da conta"
          type="email"
          autocomplete="email"
          :rules="[obrigatorio, emailValido]"
        />
        <v-btn type="submit" color="primary" class="dote-cta" block size="large" :loading="carregando"
          >Enviar link</v-btn
        >
      </v-form>

      <div class="mt-6 text-body-2"><router-link to="/login" class="text-neon-600">Voltar ao login</router-link></div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { ref } from 'vue';
import { useAcao } from '../composables/useAcao';
import { authApi } from '../api/auth';
import { useToastStore } from '../stores/toast';
import { email as emailValido, obrigatorio } from '../utils/regrasForm';

const toast = useToastStore();
const email = ref('');
const mensagem = ref('');
const { carregando, erro, executar } = useAcao();

async function enviar(evento) {
  if (!(await evento).valid) return;
  const r = await executar(() => authApi.forgotPassword(email.value));
  if (!r) return;
  mensagem.value = r.message;
  toast.mostrar('Pedido enviado', 'info');
}
</script>
