<template>
  <svg
    class="dote-diamante"
    :class="{ 'dote-diamante--alerta': alerta, 'dote-diamante--sobre-neon': sobreNeon }"
    :width="tamanho"
    :height="(Number(tamanho) * ALTURA) / LARGURA"
    :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
    shape-rendering="crispEdges"
    :role="rotulo ? 'img' : undefined"
    :aria-label="rotulo || undefined"
    :aria-hidden="rotulo ? undefined : 'true'"
  >
    <rect v-for="p in PIXELS" :key="`${p.x}-${p.y}`" :x="p.x" :y="p.y" width="1" height="1" :class="p.classe" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  tamanho: { type: [Number, String], default: 28 },
  alerta: { type: Boolean, default: false },
  sobreNeon: { type: Boolean, default: false },
  rotulo: { type: String, default: '' },
});

const SPRITE = [
  '..BBBBBBBBB..',
  '.BBBBBBBBBBB.',
  '.BBEEBBBEEBB.',
  '.BBEEBBBEEBB.',
  '.BBBBBBBBBBB.',
  '.BBBBMMMBBBB.',
  '..BBBBBBBBB..',
  '..B.B...B.B..',
];
const LARGURA = SPRITE[0].length;
const ALTURA = SPRITE.length;
const CLASSES = { B: 'dote-v-corpo', E: 'dote-v-olho', M: 'dote-v-boca' };

const PIXELS = SPRITE.flatMap((linha, y) =>
  [...linha].flatMap((c, x) => (CLASSES[c] ? [{ x, y, classe: CLASSES[c] }] : [])),
);
</script>

<style scoped>
.dote-diamante {
  display: block;
  overflow: visible;
  --dote-diamante-cor: rgb(var(--v-theme-neon-600));
}
.dote-v-corpo {
  fill: var(--dote-diamante-cor);
}
.dote-v-olho,
.dote-v-boca {
  fill: rgb(var(--v-theme-background));
}
.dote-v-olho {
  animation: dote-piscar 5s steps(1) infinite;
}
@keyframes dote-piscar {
  0%,
  94% {
    fill: rgb(var(--v-theme-background));
  }
  95%,
  98% {
    fill: var(--dote-diamante-cor);
  }
}
.dote-diamante--alerta .dote-v-corpo {
  fill: rgb(var(--v-theme-primary));
}
.dote-diamante--alerta {
  filter: drop-shadow(0 0 3px rgba(var(--v-theme-primary), 0.55));
}
.dote-diamante--alerta .dote-v-olho {
  animation-name: dote-piscar-alerta;
}
@keyframes dote-piscar-alerta {
  0%,
  94% {
    fill: rgb(var(--v-theme-background));
  }
  95%,
  98% {
    fill: rgb(var(--v-theme-primary));
  }
}
.dote-diamante--sobre-neon .dote-v-corpo,
.dote-diamante--sobre-neon.dote-diamante--alerta .dote-v-corpo {
  fill: rgb(var(--v-theme-on-primary));
}
.dote-diamante--sobre-neon .dote-v-olho,
.dote-diamante--sobre-neon .dote-v-boca {
  fill: rgb(var(--v-theme-primary));
  animation: none;
}
.dote-diamante--sobre-neon.dote-diamante--alerta {
  filter: none;
}
@media (prefers-reduced-motion: reduce) {
  .dote-v-olho {
    animation: none;
  }
}
</style>
