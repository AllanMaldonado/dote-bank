<template>
  <div class="dote-entrada">
    <v-card class="pa-8">
      <router-link to="/" aria-label="DOTE, início" class="d-inline-block mb-5"
        ><MarcaDote :altura="30"
      /></router-link>
      <h1 class="dote-title mb-6">&gt; nova senha</h1>

      <v-alert v-if="!token" type="error" variant="tonal" density="compact" class="mb-4">
        Link incompleto. Peça um novo em "Esqueci a senha".
      </v-alert>
      <AlertaErro :mensagem="erro" class="mb-4" />

      <v-form v-if="token" validate-on="submit" @submit.prevent="enviar">
        <v-text-field
          v-model="senha"
          label="Nova senha"
          type="password"
          autocomplete="new-password"
          hint="de 8 a 72 caracteres"
          :rules="[obrigatorio, senhaValida]"
        />
        <v-text-field
          v-model="confirmacao"
          label="Repita a nova senha"
          type="password"
          autocomplete="new-password"
          :rules="[obrigatorio, iguais(() => senha)]"
        />
        <v-btn type="submit" color="primary" class="dote-cta" block size="large" :loading="carregando">
          Salvar nova senha
        </v-btn>
      </v-form>

      <div class="mt-6 text-body-2">
        <router-link to="/esqueci-senha" class="text-neon-600">Pedir outro link</router-link>
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
import { authApi } from '../api/auth';
import { useToastStore } from '../stores/toast';
import { iguais, obrigatorio, senha as senhaValida } from '../utils/regrasForm';

const toast = useToastStore();
const route = useRoute();
const router = useRouter();
const token = typeof route.query.token === 'string' ? route.query.token : '';
const senha = ref('');
const confirmacao = ref('');
const { carregando, erro, executar } = useAcao();

async function enviar(evento) {
  if (!(await evento).valid) return;
  const r = await executar(() => authApi.resetPassword(token, senha.value));
  if (!r) return;
  toast.mostrar('Senha redefinida');
  router.push({ path: '/login', query: { aviso: r.message } });
}
</script>
