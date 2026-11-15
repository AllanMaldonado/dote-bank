<template>
  <v-snackbar v-model="toast.aberto" :color="toast.tipo" :timeout="toast.duracao" location="top" role="status">
    {{ toast.texto }}
    <template #actions>
      <v-btn variant="text" aria-label="Fechar aviso" @click="toast.aberto = false">Fechar</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast';

const toast = useToastStore();
</script>
