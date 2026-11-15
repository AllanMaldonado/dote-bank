<template>
  <div class="dote-entrada">
    <v-card class="pa-8">
      <router-link to="/" aria-label="DOTE, início" class="d-inline-block mb-5"
        ><MarcaDote :altura="30"
      /></router-link>
      <h1 class="dote-title mb-1">&gt; abrir conta</h1>
      <p class="text-muted text-body-2 mb-6">
        Sua conta passa por aprovação e, aprovada, já começa com P$ 1.000 em pontos.
      </p>

      <AlertaErro :mensagem="erro" class="mb-4" />

      <v-form validate-on="submit" @submit.prevent="enviar">
        <v-text-field v-model="form.nome" label="Nome completo" autocomplete="name" :rules="[obrigatorio]" />
        <v-text-field
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          placeholder="nome@email.com"
          :rules="[obrigatorio, regras.email]"
        />
        <v-text-field
          v-model="form.cpf"
          label="CPF"
          inputmode="numeric"
          placeholder="000.000.000-00"
          :rules="[obrigatorio, regras.cpf]"
        />
        <v-text-field
          v-model="form.celular"
          label="Celular (opcional)"
          inputmode="tel"
          placeholder="(18) 99999-9999"
          :rules="[regras.celular]"
        />
        <v-text-field
          v-model="form.senha"
          label="Senha"
          type="password"
          autocomplete="new-password"
          hint="de 8 a 72 caracteres"
          :rules="[obrigatorio, regras.senha]"
        />
        <v-btn type="submit" color="primary" class="dote-cta" block size="large" :loading="carregando"
          >Enviar cadastro</v-btn
        >
      </v-form>

      <div class="mt-6 text-body-2">
        Já tem conta? <router-link to="/login" class="text-neon-600">Entrar</router-link> ·
        <router-link to="/" class="text-muted">&larr; início</router-link>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAcao } from '../composables/useAcao';
import { rotaInicial, useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import * as regras from '../utils/regrasForm';

const { obrigatorio } = regras;

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const form = reactive({ nome: '', email: '', cpf: '', celular: '', senha: '' });
const { carregando, erro, executar } = useAcao();

async function enviar(evento) {
  if (!(await evento).valid) return;
  const usuario = await executar(() => auth.register({ ...form, celular: form.celular || undefined }));
  if (!usuario) return;
  toast.mostrar('Cadastro recebido! Acompanhe a aprovação por aqui.');
  router.push(rotaInicial(usuario));
}
</script>
