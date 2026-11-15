<template>
  <canvas ref="tela" class="dote-matrix" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const tela = ref(null);

const CARACTERES = '01$+-=<>/%#';
const CELULA = 16;  
const QUADROS = 12;  
const PALETA = [
  ['neon-800', 0.9],
  ['neon-800', 0.9],
  ['neon-800', 0.6],
  ['neon-600', 0.45],
  ['neon-300', 0.25],
];

let ctx = null;
let colunas = [];
let largura = 0;
let altura = 0;
let rastro = '';
let cores = [];
let raf = 0;
let ultimo = 0;
let observador = null;

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

function rgba(token, alfa) {
  const v = getComputedStyle(tela.value).getPropertyValue(`--v-theme-${token}`).trim();
  return `rgba(${v}, ${alfa})`;
}

function preparar() {
  const el = tela.value;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  largura = el.clientWidth;
  altura = el.clientHeight;
  if (!largura || !altura) return false;
  el.width = largura * dpr;
  el.height = altura * dpr;
  ctx = el.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${CELULA - 2}px "Share Tech Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'top';
  rastro = rgba('surface', 0.14);
  cores = PALETA.map(([token, alfa]) => rgba(token, alfa));
  const linhas = Math.ceil(altura / CELULA);
  colunas = Array.from({ length: Math.ceil(largura / CELULA) }, () => ({
    y: -Math.floor(Math.random() * linhas),
    vel: 0.35 + Math.random() * 0.65,
    cor: sortear(cores),
  }));
  ctx.fillStyle = rgba('surface', 1);
  ctx.fillRect(0, 0, largura, altura);
  for (let i = 0; i < linhas * 3; i++) quadro();  
  return true;
}

function quadro() {
  ctx.fillStyle = rastro;
  ctx.fillRect(0, 0, largura, altura);
  colunas.forEach((c, i) => {
    if (c.y >= 0) {
      ctx.fillStyle = c.cor;
      ctx.fillText(sortear(CARACTERES), i * CELULA, Math.floor(c.y) * CELULA);
    }
    c.y += c.vel;
    if (c.y * CELULA > altura && Math.random() > 0.97) {
      c.y = 0;
      c.cor = sortear(cores);
    }
  });
}

function animar(agora) {
  raf = requestAnimationFrame(animar);
  if (agora - ultimo < 1000 / QUADROS) return;
  ultimo = agora;
  quadro();
}

onMounted(() => {
  if (!preparar()) return;
  raf = requestAnimationFrame(animar);
  observador = new ResizeObserver(preparar);
  observador.observe(tela.value);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  observador?.disconnect();
});
</script>

<style scoped>
.dote-matrix {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.7;
  -webkit-mask-image: linear-gradient(to bottom, rgb(var(--v-theme-on-surface)) 70%, transparent 100%);
  mask-image: linear-gradient(to bottom, rgb(var(--v-theme-on-surface)) 70%, transparent 100%);
}
</style>
