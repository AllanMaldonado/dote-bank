<template>
  <span class="dote-logotipo" :class="`dote-logotipo--${variante}`" :role="alt ? 'img' : undefined" :aria-label="alt || undefined">
    <svg
      class="dote-logotipo-simbolo"
      viewBox="0 0 480 400"
      :height="altura"
      :width="(Number(altura) * 480) / 400"
      aria-hidden="true"
      focusable="false"
    >
      <polygon v-for="p in PECAS" :key="p" :points="p" />
    </svg>
    <span v-if="variante === 'completo'" class="dote-logotipo-nome" :style="{ fontSize: `${Number(altura) * 0.9}px` }" aria-hidden="true"
      >{{ nome }}</span
    >
  </span>
</template>

<script setup lang="ts">
const PECAS = [
  '64,0 416,0 480,90 0,90',
  '0,110 125,110 230,252 230,398 195,398 0,156',
  '480,156 285,398 250,398 250,252 355,110 480,110',
];

defineProps({
  variante: { type: String, default: 'simbolo', validator: (v) => ['simbolo', 'completo'].includes(String(v)) },
  altura: { type: [Number, String], default: 28 },
  nome: { type: String, default: 'DOTE' },
  alt: { type: String, default: 'DOTE' },
});
</script>

<style scoped>
.dote-logotipo {
  display: inline-flex;
  align-items: center;
  gap: 0.28em;  
  line-height: 1;
}
.dote-logotipo-simbolo {
  display: block;
  flex: none;
  fill: rgb(var(--v-theme-primary));
}
.dote-logotipo-nome {
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
