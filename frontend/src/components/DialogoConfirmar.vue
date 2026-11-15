<template>
  <v-dialog v-model="aberto" max-width="500">
    <v-card class="pa-6">
      <h3 class="dote-title mb-2">{{ titulo }}</h3>
      <p class="text-muted mb-6">{{ mensagem }}</p>
      <div class="d-flex justify-end ga-2">
        <v-btn variant="text" color="muted" @click="aberto = false">Cancelar</v-btn>
        <v-btn :color="perigo ? 'error' : 'primary'" :loading="carregando" @click="$emit('confirmar')">{{
          acao
        }}</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const aberto = defineModel({ type: Boolean, default: false });
defineProps({
  titulo: { type: String, required: true },
  mensagem: { type: String, default: '' },
  acao: { type: String, default: 'Confirmar' },
  perigo: { type: Boolean, default: false },
  carregando: { type: Boolean, default: false },
});
defineEmits(['confirmar']);
</script>
