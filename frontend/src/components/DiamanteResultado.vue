<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-chip :prepend-icon="comIA ? 'mdi-creation-outline' : 'mdi-calculator-variant-outline'">
        {{ comIA ? `IA · ${analise.modelo}` : 'sem IA · por regras' }}
      </v-chip>
      <span v-if="analise.aviso" class="text-warning text-body-2">{{ analise.aviso }}</span>
      <v-spacer />
      <v-btn variant="text" color="neon-300" size="small" prepend-icon="mdi-arrow-left" @click="$emit('voltar')"
        >Voltar aos avisos</v-btn
      >
    </div>
    <div v-if="secoes.length" class="dote-analise-secoes">
      <section v-for="s in secoes" :key="s.titulo" class="dote-analise-secao">
        <div class="dote-label mb-2">{{ s.titulo }}</div>
        <p class="ma-0">{{ s.texto }}</p>
      </section>
    </div>
    <p v-else class="dote-analise ma-0">{{ analise.texto }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({ analise: { type: Object, required: true } });
defineEmits(['voltar']);

const comIA = computed(() => props.analise.fonte === 'gemini');
const secoes = computed(() => {
  const m = props.analise.texto?.match(/^Resumo:\s*([\s\S]+?)\nPadrões:\s*([\s\S]+?)\nDicas:\s*([\s\S]+)$/u);
  if (!m) return [];
  return [
    { titulo: 'resumo', texto: m[1].trim() },
    { titulo: 'padrões', texto: m[2].trim() },
    { titulo: 'dicas', texto: m[3].trim() },
  ];
});
</script>

<style scoped>
.dote-analise-secoes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.dote-analise-secao {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
  font-size: 14px;
  line-height: 1.6;
}
.dote-analise {
  white-space: pre-line;
  line-height: 1.6;
}
@media (max-width: 700px) {
  .dote-analise-secoes {
    grid-template-columns: 1fr;
  }
}
</style>
