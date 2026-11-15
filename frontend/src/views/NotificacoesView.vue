<template>
  <div>
    <AlertaErro :mensagem="erro" class="mb-4" />

    <div class="d-flex align-center">
      <div class="dote-label">
        {{ naoLidas ? `${naoLidas} ${naoLidas === 1 ? 'aviso novo' : 'avisos novos'}` : 'tudo em dia' }}
      </div>
      <v-spacer />
      <v-btn
        v-if="itens.length"
        variant="text"
        color="neon-600"
        size="small"
        prepend-icon="mdi-check-all"
        :disabled="!naoLidas"
        @click="lerTodas"
        >Marcar todas como lidas</v-btn
      >
    </div>

    <template v-for="g in grupos" :key="g.dia">
      <div class="dote-label dote-dia">{{ g.dia }}</div>
      <div class="dote-aviso-lista">
        <div v-for="n in g.itens" :key="n.id" class="dote-aviso" :class="{ 'dote-aviso--nova': !n.lida }">
          <button type="button" class="dote-aviso-corpo" @click="abrir(n)">
            <span class="dote-aviso-icone">
              <v-icon
                :icon="ICONES[n.tipo] ?? 'mdi-bell-outline'"
                :color="CORES[n.tipo] ?? (n.lida ? undefined : 'neon-300')"
                size="20"
              />
            </span>
            <span class="dote-aviso-texto">
              <span class="dote-aviso-titulo">{{ n.titulo }}</span>
              <span class="dote-aviso-mensagem" :title="n.mensagem">{{ n.mensagem }}</span>
            </span>
          </button>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="x-small"
            color="muted"
            aria-label="Excluir aviso"
            @click="excluir(n)"
          />
        </div>
      </div>
    </template>

    <div v-if="!itens.length && !carregando" class="dote-vazio">
      <DiamanteMascote :tamanho="40" />
      <p class="text-muted ma-0">Nenhum aviso por aqui.</p>
    </div>

    <div class="d-flex justify-end mt-4">
      <Paginacao
        v-if="paginas > 1"
        v-model="pagina"
        :length="paginas"
        density="comfortable"
        :total-visible="xs ? 3 : 5"
        @update:model-value="carregar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, ref } from 'vue';
import Paginacao from '../components/Paginacao.vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import DiamanteMascote from '../components/DiamanteMascote.vue';
import { notificacoesApi } from '../api/notificacoes';
import { useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';
import { useToastStore } from '../stores/toast';
import { formatData } from '../utils/datas';

const ICONES = {
  transferencia_recebida: 'mdi-arrow-bottom-left',
  transferencia_enviada: 'mdi-arrow-top-right',
  recorrencia_executada: 'mdi-calendar-check-outline',
  recorrencia_falhou: 'mdi-calendar-alert-outline',
  rendimento: 'mdi-chart-line',
  meta_atingida: 'mdi-trophy-outline',
  conta_aprovada: 'mdi-check-decagram-outline',
  conta_bloqueada: 'mdi-lock-outline',
  conta_desbloqueada: 'mdi-lock-open-outline',
};
const CORES = {
  transferencia_enviada: 'error',
  recorrencia_executada: 'error',
  transferencia_recebida: 'success',
  recorrencia_falhou: 'warning',
  conta_bloqueada: 'error',
};
const LIMITE = 4;
const emit = defineEmits(['navegar']);
const auth = useAuthStore();
const contaStore = useContaStore();
const toast = useToastStore();
const { xs } = useDisplay();
const router = useRouter();
const itens = ref([]);
const total = ref(0);
const naoLidas = ref(0);
const pagina = ref(1);
const paginas = computed(() => Math.ceil(total.value / LIMITE));
const { carregando, erro, executar } = useAcao();

const grupos = computed(() => {
  const porDia = new Map();
  for (const n of itens.value) {
    const dia = formatData(n.data);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push(n);
  }
  return [...porDia].map(([dia, lista]) => ({ dia, itens: lista }));
});

async function carregar() {
  await executar(async () => {
    let r = await notificacoesApi.listar({ pagina: pagina.value, limite: LIMITE });
    const ultima = Math.max(1, Math.ceil(r.total / LIMITE));
    if (pagina.value > ultima) {
      pagina.value = ultima;
      r = await notificacoesApi.listar({ pagina: ultima, limite: LIMITE });
    }
    itens.value = r.itens;
    total.value = r.total;
    naoLidas.value = r.naoLidas;
  });
  await contaStore.atualizar(auth.user).catch(() => {});
}

async function abrir(n) {
  if (!n.lida) await executar(() => notificacoesApi.marcarLida(n.id));
  if (n.link) {
    emit('navegar');
    await router.push(n.link);
  }
  else carregar();
}

async function lerTodas() {
  const ok = await executar(() => notificacoesApi.marcarTodasLidas());
  if (ok !== undefined) toast.mostrar('Avisos marcados como lidos', 'success', 1500);
  carregar();
}

async function excluir(n) {
  const ok = await executar(() => notificacoesApi.excluir(n.id));
  if (ok !== undefined) toast.mostrar('Aviso excluído', 'success', 1500);
  carregar();
}

aoAbrirTela(carregar);
</script>

<style scoped>
.dote-dia {
  margin: 16px 0 8px;
}
.dote-aviso-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dote-aviso {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 4px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: background-color 180ms ease;
}
.dote-aviso--nova {
  background: rgb(var(--v-theme-surface-bright));
}
.dote-aviso:hover,
.dote-aviso:focus-within {
  background: rgb(var(--v-theme-surface-bright));
}
.dote-aviso-corpo {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
}
.dote-aviso-icone {
  flex: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-bright));
  color: rgb(var(--v-theme-muted));
}
.dote-aviso--nova .dote-aviso-icone {
  background: rgb(var(--v-theme-neon-950));
  color: rgb(var(--v-theme-neon-300));
}
.dote-aviso-texto {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dote-aviso-titulo {
  font-size: 15px;
  color: rgb(var(--v-theme-muted));
}
.dote-aviso--nova .dote-aviso-titulo {
  color: rgb(var(--v-theme-neon-300));
}
.dote-aviso-mensagem {
  font-size: 13px;
  line-height: 1.45;
  color: rgb(var(--v-theme-muted));
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dote-aviso--nova .dote-aviso-mensagem {
  color: rgb(var(--v-theme-on-surface));
}
.dote-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}
@media (prefers-reduced-motion: reduce) {
  .dote-aviso {
    transition: none;
  }
}
</style>
