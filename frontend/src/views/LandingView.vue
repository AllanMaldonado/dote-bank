<template>
  <div class="dote-landing-pagina">
  <div class="dote-landing">
    <section class="dote-quadro dote-quadro--hero">
      <header class="dote-topo">
        <router-link to="/" aria-label="DOTE BANK, início"><MarcaDote :altura="30" alt="DOTE BANK" /></router-link>
        <v-btn v-if="auth.user" :to="minhaConta" variant="text" class="dote-minha-conta" aria-label="Minha conta">
          <span class="dote-minha-conta-texto">Minha conta</span>
          <v-avatar color="neon-950" size="36" class="ml-2">
            <span class="text-on-neon-950">{{ iniciais }}</span>
          </v-avatar>
        </v-btn>
        <v-btn v-else to="/login" variant="text" color="neon-300" prepend-icon="mdi-login">Entrar</v-btn>
      </header>

      <div class="dote-hero">
        <div class="dote-hero-coluna">
          <h1 class="dote-hero-titulo dote-cursor dote-entra" style="--atraso: 0ms">DOTE BANK</h1>
          <p class="dote-hero-texto dote-entra" style="--atraso: 120ms">
            Seus pontos rendendo de verdade: envie transferências na hora, guarde em caixinhas e deixe o Diamante cuidar do
            resto.
          </p>
          <div class="dote-acoes dote-entra" style="--atraso: 240ms">
            <v-btn
              v-if="auth.user"
              color="primary"
              class="dote-cta"
              size="x-large"
              :to="inicio"
              append-icon="mdi-arrow-right"
              >Ir para minha conta</v-btn
            >
            <template v-else>
              <v-btn color="primary" class="dote-cta" size="x-large" to="/cadastro" append-icon="mdi-arrow-right"
                >Abrir conta</v-btn
              >
              <v-btn color="neon-950" size="x-large" to="/login">Já tenho conta</v-btn>
            </template>
          </div>
          <ul class="dote-numeros dote-entra" style="--atraso: 320ms">
            <li><span class="dote-num">P$ 1.000</span>para começar</li>
            <li><span class="dote-num">105%</span>do Índice Points nas caixinhas</li>
            <li><span class="dote-num">6</span>caixinhas com meta</li>
          </ul>
        </div>
        <div class="dote-moeda dote-entra" style="--atraso: 200ms" aria-hidden="true">
          <div class="dote-moeda-paralaxe">
            <div class="dote-moeda-disco">
              <span class="dote-anel dote-anel--a" />
              <span class="dote-anel dote-anel--b" />
              <span class="dote-anel dote-anel--c" />
              <span class="dote-anel dote-anel--d" />
              <MarcaDote class="dote-moeda-logo" :altura="92" alt="" />
            </div>
            <div class="dote-label dote-moeda-legenda">seus pontos rendendo</div>
          </div>
        </div>
      </div>

      <button type="button" class="dote-descer" @click="irParaRecursos">
        conheça o DOTE BANK
        <v-icon icon="mdi-chevron-down" size="18" />
      </button>
    </section>

    <section id="recursos" class="dote-quadro dote-quadro--recursos">
      <h2 class="dote-title">&gt; o que o DOTE BANK faz</h2>
      <div class="dote-recursos">
        <div v-for="(r, i) in RECURSOS" :key="r.titulo" class="dote-recurso" :style="{ '--i': i }">
          <span class="dote-recurso-icone">
            <DiamanteMascote v-if="r.mascote" :tamanho="26" />
            <v-icon v-else :icon="r.icone" size="20" color="neon-300" />
          </span>
          <div>
            <div class="dote-recurso-titulo">{{ r.titulo }}</div>
            <div class="text-muted dote-recurso-texto">{{ r.texto }}</div>
          </div>
        </div>
      </div>

      <h2 class="dote-title">&gt; como começar</h2>
      <ol class="dote-passos">
        <li v-for="(p, i) in PASSOS" :key="p">
          <span class="dote-passo-n">{{ i + 1 }}</span
          >{{ p }}
        </li>
      </ol>

      <footer class="dote-rodape">
        <MarcaDote variante="completo" nome="DOTE BANK" alt="DOTE BANK" :altura="16" />
        <span>&copy; 2026</span>
      </footer>
    </section>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconePix from '../components/IconePix.vue';
import MarcaDote from '../components/MarcaDote.vue';
import DiamanteMascote from '../components/DiamanteMascote.vue';
import { rotaInicial, useAuthStore } from '../stores/auth';
import { iniciaisDoNome } from '../utils/iniciais';

const auth = useAuthStore();
const iniciais = computed(() => iniciaisDoNome(auth.user?.nome));
const inicio = computed(() => (auth.user ? rotaInicial(auth.user) : '/'));
const minhaConta = computed(() =>
  auth.user?.perfil === 'cliente' && auth.user.status === 'ativo' ? '/perfil' : inicio.value,
);

const RECURSOS = [
  { icone: IconePix, titulo: 'Transferência com comprovante', texto: 'Envie pontos na hora e salve o PDF.' },
  { icone: 'mdi-key-outline', titulo: 'Suas chaves', texto: 'CPF, e-mail, celular e aleatória.' },
  {
    icone: 'mdi-piggy-bank-outline',
    titulo: 'Caixinhas com meta',
    texto: 'Até 6 objetivos rendendo 105% do Índice Points.',
  },
  { icone: 'mdi-calendar-sync-outline', titulo: 'Transferência agendada', texto: 'Contas do mês no automático.' },
  { icone: 'mdi-chart-bar', titulo: 'Extrato e relatório', texto: 'Filtre, veja para onde foram e exporte.' },
  { mascote: true, titulo: 'Diamante', texto: 'Avisa cada movimento e analisa seu dinheiro.' },
];

const PASSOS = ['Abra sua conta com seu e-mail', 'Aguarde a aprovação', 'Ganhe P$ 1.000 e use à vontade'];

function irParaRecursos() {
  const alvo = document.getElementById('recursos');
  if (!alvo) return;
  alvo.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
</script>

<style scoped>
.dote-landing-pagina {
  overflow-x: clip;
}
.dote-landing {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 24px;
}
.dote-quadro {
  padding: 24px 0;
}
.dote-quadro--hero {
  position: relative;
  isolation: isolate;
  min-height: min(100vh, 780px);
  display: flex;
  flex-direction: column;
}
.dote-quadro--hero::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 8%;
  right: -120px;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0) 70%);
  animation: dote-derivar 14s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes dote-derivar {
  to {
    transform: translate(-70px, 50px) scale(1.15);
  }
}
.dote-quadro--recursos {
  padding: 64px 0 32px;
}
.dote-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dote-minha-conta-texto {
  color: rgb(var(--v-theme-muted));
}
.dote-hero {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 112px;  
  padding: 48px 0;
}
.dote-hero-coluna {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}
.dote-hero-titulo {
  font-size: clamp(64px, 11vw, 120px);
  line-height: 1;
  font-weight: 400;
  letter-spacing: 0.1em;
  color: rgb(var(--v-theme-primary));
}
.dote-hero-texto {
  max-width: 520px;
  font-size: clamp(17px, 1.8vw, 20px);
  line-height: 1.5;
  color: rgb(var(--v-theme-muted));
}
.dote-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.dote-numeros {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  font-size: 13px;
  color: rgb(var(--v-theme-muted));
}
.dote-numeros li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dote-numeros .dote-num {
  font-size: 20px;
  color: rgb(var(--v-theme-on-surface));
}


.dote-moeda {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 24px;
}
.dote-moeda-paralaxe {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;  
}
.dote-moeda-disco {
  position: relative;
  width: clamp(150px, 18vw, 200px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(var(--v-theme-primary), 0.18) 0%, rgba(var(--v-theme-primary), 0) 68%),
    rgb(var(--v-theme-surface));
  box-shadow:
    0 0 60px rgba(var(--v-theme-primary), 0.18),
    0 0 0 14px rgb(var(--v-theme-surface)),
    0 0 0 15px rgb(var(--v-theme-outline));
  animation:
    dote-flutuar 6s ease-in-out infinite,
    dote-halo 4s ease-in-out infinite;
}
.dote-anel {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  border: 1px solid rgb(var(--v-theme-outline));
  animation: dote-girar var(--vel) linear infinite var(--sentido, normal);
}
.dote-anel::after {
  content: '';
  position: absolute;
  top: calc(var(--sat) / -2);
  left: calc(50% - var(--sat) / 2);
  width: var(--sat);
  height: var(--sat);
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 10px rgba(var(--v-theme-primary), 0.8);
}
.dote-anel--a {
  inset: -9%;
  border-style: dashed;
  --vel: 36s;
  --sat: 7px;
}
.dote-anel--b {
  inset: -15%;
  border-style: dotted;
  --vel: 22s;
  --sentido: reverse;
  --sat: 5px;
}
.dote-anel--c {
  inset: -21%;
  --vel: 14s;
  --sat: 9px;
}
.dote-anel--d {
  inset: -27%;
  border-style: dashed;
  opacity: 0.6;
  --vel: 58s;
  --sentido: reverse;
  --sat: 4px;
}
.dote-moeda-logo {
  filter: drop-shadow(0 0 6px rgba(var(--v-theme-primary), 0.9)) drop-shadow(0 0 18px rgba(var(--v-theme-primary), 0.6))
    drop-shadow(0 0 40px rgba(var(--v-theme-primary), 0.35));
  animation: dote-cintilar 4s ease-in-out infinite;
}
@keyframes dote-flutuar {
  50% {
    transform: translateY(-10px);
  }
}
@keyframes dote-halo {
  50% {
    box-shadow:
      0 0 90px rgba(var(--v-theme-primary), 0.3),
      0 0 0 14px rgb(var(--v-theme-surface)),
      0 0 0 15px rgb(var(--v-theme-outline));
  }
}
@keyframes dote-girar {
  to {
    transform: rotate(360deg);
  }
}
@keyframes dote-cintilar {
  50% {
    filter: drop-shadow(0 0 10px rgba(var(--v-theme-primary), 1)) drop-shadow(0 0 28px rgba(var(--v-theme-primary), 0.75))
      drop-shadow(0 0 64px rgba(var(--v-theme-primary), 0.45));
  }
}

.dote-entra {
  animation: dote-subir 0.6s ease-out both;
  animation-delay: var(--atraso, 0ms);
}
@keyframes dote-subir {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}

.dote-descer {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-muted));
  cursor: pointer;
  transition: color 0.2s;
}
.dote-descer:hover,
.dote-descer:focus-visible {
  color: rgb(var(--v-theme-on-surface));
}
.dote-descer .v-icon {
  animation: dote-quicar 1.6s ease-in-out infinite;
}
@keyframes dote-quicar {
  50% {
    transform: translateY(4px);
  }
}

.dote-title {
  margin-bottom: 24px;
}
.dote-recursos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}
.dote-recurso {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  transition:
    transform 0.2s,
    background-color 0.2s;
}
.dote-recurso:hover {
  transform: translateY(-3px);
  background: rgb(var(--v-theme-surface-bright));
}
.dote-recurso-icone {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgb(var(--v-theme-neon-950));
}
.dote-recurso-icone :deep(.dote-diamante) {
  --dote-diamante-cor: rgb(var(--v-theme-neon-300));  
}
.dote-recurso-titulo {
  font-size: 15px;
}
.dote-recurso-texto {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}
.dote-passos {
  list-style: none;
  padding: 0;
  margin: 0 0 48px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  font-size: 14px;
}
.dote-passos li {
  display: flex;
  align-items: center;
}
.dote-passo-n {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-neon-950));
  color: rgb(var(--v-theme-neon-300));
  font-size: 12px;
}
.dote-rodape {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid rgb(var(--v-theme-outline));
  font-size: 12px;
  color: rgb(var(--v-theme-muted));
}

@supports (animation-timeline: view()) {
  .dote-title,
  .dote-recurso,
  .dote-passos li,
  .dote-rodape {
    animation: dote-subir linear both;
    animation-timeline: view();
    animation-range: entry calc(var(--i, 0) * 6%) entry calc(40% + var(--i, 0) * 6%);
  }
  .dote-passos li:nth-child(2) {
    --i: 1;
  }
  .dote-passos li:nth-child(3) {
    --i: 2;
  }
}
@supports (animation-timeline: scroll()) {
  .dote-moeda-paralaxe {
    animation: dote-paralaxe linear both;
    animation-timeline: scroll(root);
    animation-range: 0 70vh;
  }
}
@keyframes dote-paralaxe {
  to {
    transform: translateY(90px) scale(0.92);
    opacity: 0.15;
  }
}

@media (max-width: 860px) {
  .dote-hero {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 32px 0;
  }
  .dote-moeda {
    display: none;  
  }
  .dote-recursos {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 600px) {
  .dote-landing {
    padding: 0 16px;
  }
  .dote-quadro--hero {
    min-height: auto;
  }
  .dote-quadro--recursos {
    padding-top: 48px;
  }
  .dote-hero {
    padding: 24px 0 16px;
  }
  .dote-acoes {
    width: 100%;
    flex-direction: column;
  }
  .dote-acoes .v-btn {
    width: 100%;
  }
  .dote-recurso {
    flex-direction: column;
    gap: 8px;
    padding: 16px;
  }
  .dote-descer {
    display: none;
  }
  .dote-minha-conta-texto {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dote-title,
  .dote-recurso,
  .dote-passos li,
  .dote-rodape,
  .dote-moeda-paralaxe,
  .dote-descer .v-icon {
    animation: none;
  }
  .dote-recurso {
    transition: none;
  }
}
</style>
