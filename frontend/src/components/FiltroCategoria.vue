<template>
  <v-menu v-model="aberto" location="bottom start" :close-on-content-click="true" transition="slide-y-transition">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        class="dote-filtro-botao"
        :class="{ 'dote-filtro-botao--ativo': !!categoria || aberto }"
        :prepend-icon="ICONES_CATEGORIAS[categoria] ?? 'mdi-tag-outline'"
        :append-icon="aberto ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        :disabled="desabilitado"
        :aria-label="categoria ? `Categoria: ${categoria}` : 'Categoria: todas'"
      >
        {{ categoria || 'Categoria' }}
      </v-btn>
    </template>
    <v-list density="comfortable" class="dote-menu-lista" aria-label="Categorias">
      <v-list-item
        title="Todas as categorias"
        prepend-icon="mdi-tag-multiple-outline"
        :class="{ 'dote-opcao-ativa': !categoria }"
        @click="categoria = null"
      />
      <v-list-item
        v-for="opcao in CATEGORIAS"
        :key="opcao"
        :title="opcao"
        :prepend-icon="ICONES_CATEGORIAS[opcao]"
        :class="{ 'dote-opcao-ativa': categoria === opcao }"
        @click="categoria = opcao"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CATEGORIAS, ICONES_CATEGORIAS } from '../utils/constantes';

defineProps({ desabilitado: Boolean });
const categoria = defineModel({ type: String, default: null });
const aberto = ref(false);
</script>
