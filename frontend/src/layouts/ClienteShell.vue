<template>
  <header class="dote-topo">
    <div class="dote-topo-interno">
      <router-link
        to="/inicio"
        class="dote-marca"
        :class="{ 'dote-marca--interna': !route.meta.inicio }"
        aria-label="DOTE, início"
      >
        <MarcaDote :altura="26" />
      </router-link>
      <v-btn
        v-if="!route.meta.inicio"
        icon="mdi-chevron-left"
        variant="text"
        aria-label="Voltar"
        class="dote-topo-voltar"
        @click="voltar"
      />
      <nav class="dote-barra" aria-label="Navegação principal">
        <div class="dote-barra-interna">
          <router-link
            v-for="item in ITENS"
            :key="item.para"
            :to="item.para"
            class="dote-barra-item"
            :class="{ 'dote-barra-item--ativo': secaoAtual === item.para }"
            :aria-current="secaoAtual === item.para ? 'page' : undefined"
          >
            <span class="dote-barra-icone"><v-icon :icon="item.icone" size="21" /></span>
            <span class="dote-barra-rotulo">{{ item.titulo }}</span>
          </router-link>
        </div>
      </nav>
      <div class="dote-topo-acoes">
        <v-btn
          :icon="preferencias.valoresOcultos ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          :aria-label="preferencias.valoresOcultos ? 'Mostrar valores' : 'Ocultar valores'"
          :aria-pressed="preferencias.valoresOcultos"
          variant="text"
          @click="preferencias.alternarValores()"
        />
        <v-btn icon variant="text" to="/perfil" aria-label="Meu perfil">
          <v-avatar color="neon-950" size="36">
            <span class="text-on-neon-950">{{ iniciais }}</span>
          </v-avatar>
        </v-btn>
      </div>
    </div>
  </header>
  <v-main>
    <div class="dote-coluna" :class="{ 'dote-coluna--inicio': route.meta.inicio }">
      <h1 v-if="!route.meta.inicio && !route.meta.semTitulo" class="dote-titulo-pagina">{{ route.meta.titulo }}</h1>

      <router-view v-slot="{ Component, route: rota }">
        <keep-alive :max="12" exclude="PixView">
          <component :is="Component" :key="rota.path" :class="{ 'dote-entrada-tela': secaoAtual !== '/extrato' }" />
        </keep-alive>
      </router-view>
    </div>
  </v-main>
  <v-btn
    :icon="claro ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
    :aria-label="claro ? 'Ativar tema escuro' : 'Ativar tema claro'"
    class="dote-flutuante dote-flutuante--esquerda"
    @click="preferencias.definir('tema', claro ? 'escuro' : 'claro')"
  />
  <BotaoNotificacoes class="dote-flutuante dote-flutuante--direita" @abrir="avisosAbertos = true" />
  <DiamanteModal v-model="avisosAbertos" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BotaoNotificacoes from '../components/BotaoNotificacoes.vue';
import IconePix from '../components/IconePix.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { useAuthStore } from '../stores/auth';
import { usePreferenciasStore } from '../stores/preferencias';
import { iniciaisDoNome } from '../utils/iniciais';
import DiamanteModal from '../components/DiamanteModal.vue';

const ITENS = [
  { titulo: 'Início', para: '/inicio', icone: 'mdi-home-variant-outline' },
  { titulo: 'Transferências', para: '/pix', icone: IconePix },
  { titulo: 'Caixinhas', para: '/caixinhas', icone: 'mdi-piggy-bank-outline' },
  { titulo: 'Extrato', para: '/extrato', icone: 'mdi-receipt-text-outline' },
];

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const preferencias = usePreferenciasStore();
const claro = computed(() => preferencias.tema === 'claro');
const iniciais = computed(() => iniciaisDoNome(auth.user?.nome));
const avisosAbertos = ref(false);
watch(() => route.fullPath, () => {
  avisosAbertos.value = !!route.query.avisos;
}, { immediate: true });
watch(avisosAbertos, (aberto) => {
  if (aberto || !route.query.avisos) return;
  const { avisos, ...query } = route.query;
  router.replace({ path: route.path, query, hash: route.hash });
});

const secaoAtual = computed(
  () => ITENS.find((i) => route.path === i.para || route.path.startsWith(`${i.para}/`))?.para ?? null,
);

function voltar() {
  if (window.history.state?.back) router.back();
  else router.push(route.meta.pai ?? '/inicio');
}

const CAMINHOS = [
  '/inicio',
  '/pix',
  '/pix/contatos',
  '/pix/chaves',
  '/extrato',
  '/extrato/relatorio',
  '/caixinhas',
  '/perfil',
  '/comprovante/_',
];
onMounted(() => {
  const preCarregar = () =>
    CAMINHOS.forEach((caminho) =>
      router.resolve(caminho).matched.forEach((r) => {
        const tela = r.components?.default;
        if (typeof tela === 'function' && tela.length === 0) {
          Promise.resolve((tela as () => unknown)()).catch(() => {});
        }
      }),
    );
  if ('requestIdleCallback' in window) window.requestIdleCallback(preCarregar);
  else setTimeout(preCarregar, 300);
});
</script>

<style scoped>
.dote-coluna {
  max-width: 640px;
  margin: 0 auto;
  padding: 8px 16px 148px;  
}
.dote-coluna--inicio {
  padding-top: 0;
}
.dote-topo {
  position: sticky;
  top: 0;
  z-index: 1005;
  background: rgb(var(--v-theme-background));
  transition: background-color 220ms ease;
}
.dote-topo-interno::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 1px;
  background: rgb(var(--v-theme-outline));
}
.dote-topo-interno {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 640px;
  min-height: 56px;
  margin: 0 auto;
  padding: 0 12px;
}
.dote-marca,
.dote-topo-acoes {
  display: flex;
  align-items: center;
}
.dote-marca {
  gap: 10px;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
}
.dote-marca--interna {
  display: none;
}
.dote-topo-acoes {
  margin-left: auto;
}
.dote-flutuante.v-btn {
  position: fixed;
  z-index: 1004;
  bottom: calc(80px + env(safe-area-inset-bottom));
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-bright));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
}
.dote-flutuante--esquerda.v-btn {
  left: 16px;
}
.dote-flutuante--direita.v-btn {
  right: 16px;
}
.dote-titulo-pagina {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 400;
  letter-spacing: 0.01em;
  margin: 8px 0 20px;
}

.dote-barra {
  position: fixed;
  z-index: 1006;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(var(--v-theme-surface), 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgb(var(--v-theme-outline));
}
.dote-barra-interna {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  padding: 6px 8px;
}
.dote-barra-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: rgb(var(--v-theme-muted));
  text-decoration: none;
  transition:
    color 180ms ease,
    background-color 180ms ease;
}
.dote-barra-icone {
  width: 56px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  transition: background 0.15s;
}
.dote-barra-rotulo {
  font-size: 11px;
  letter-spacing: 0.04em;
}
.dote-barra-item:hover,
.dote-barra-item:focus-visible {
  color: rgb(var(--v-theme-on-surface));
  outline: none;
}
.dote-barra-item:focus-visible .dote-barra-icone {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-neon-600));
}
.dote-barra-item--ativo {
  color: rgb(var(--v-theme-on-surface));
}
.dote-barra-item--ativo .dote-barra-icone {
  background: rgb(var(--v-theme-neon-950));
  color: rgb(var(--v-theme-primary));
}

@media (min-width: 960px) {
  .dote-coluna,
  .dote-topo-interno {
    max-width: 1200px;
    padding-inline: 32px;
  }
  .dote-coluna {
    padding-top: 24px;
  }
  .dote-topo-interno {
    min-height: 72px;
    gap: 32px;
  }
  .dote-marca--interna {
    display: flex;
  }
  .dote-topo-voltar {
    display: none;
  }
  .dote-topo-interno::after {
    left: 32px;
    right: 32px;
  }
  .dote-coluna {
    padding-bottom: 80px;  
  }
  .dote-flutuante.v-btn {
    bottom: 20px;
  }
  .dote-flutuante--esquerda.v-btn {
    left: max(32px, calc((100vw - 1200px) / 2 + 32px));
  }
  .dote-flutuante--direita.v-btn {
    right: max(32px, calc((100vw - 1200px) / 2 + 32px));
  }
  .dote-barra {
    position: static;
    padding: 0;
    border: 0;
    background: transparent;
  }
  .dote-barra-interna {
    gap: 4px;
    padding: 0;
  }
  .dote-barra-item {
    flex: none;
    flex-direction: row;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .dote-barra-item--ativo {
    background: rgb(var(--v-theme-neon-950));
    color: rgb(var(--v-theme-on-neon-950));
  }
  .dote-barra-icone {
    width: auto;
    height: auto;
  }
  .dote-barra-rotulo {
    font-size: 14px;
  }
}

@media print {
  .dote-topo,
  .dote-flutuante {
    display: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .dote-entrada-tela {
    animation: dote-aparecer 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}
@keyframes dote-aparecer {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dote-topo,
  .dote-barra-item,
  .dote-barra-icone {
    transition: none;
  }
}
</style>
