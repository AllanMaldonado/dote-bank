<template>
  <div>
    <v-card class="pa-4 mb-4">
      <FiltrosExtrato
        v-model:categoria="categoria"
        v-model:datas="datas"
        :data-maxima="hojeIso"
        rotulo-periodo="Este ano"
        :carregando="carregando"
        @aplicar="trocarPeriodo"
      >
        <template #acoes>
          <RelatorioExportacao :obter="() => r" :filtros="filtros" :desabilitado="carregando || !r" />
        </template>
      </FiltrosExtrato>
    </v-card>

    <AlertaErro :mensagem="erro" class="mb-4" />
    <v-progress-linear v-if="!r && !erro" indeterminate color="primary" aria-label="Carregando relatório" />

    <template v-if="r">

      <v-row dense class="mt-1">
        <v-col v-for="k in KPIS" :key="k.campo" cols="6" md="3">
          <v-card class="pa-4 h-100">
            <div class="dote-label">{{ k.rotulo }}</div>
            <div class="dote-kpi dote-num" :class="k.classe">{{ formatMoney(r.totais[k.campo]) }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-card class="pa-5 h-100">
            <div class="d-flex flex-wrap align-baseline justify-space-between ga-2 mb-3">
              <h3 class="dote-subtitulo">
                {{ r.meses.length === 1 ? 'Movimentação no período' : 'Entradas e saídas por mês' }}
              </h3>
              <span class="text-muted text-body-2">
                {{ formatData(r.periodo.inicio) }} a {{ formatData(r.periodo.fim) }} · {{ r.totais.transacoes }} {{ r.totais.transacoes === 1 ? 'transação' : 'transações' }}
              </span>
            </div>
            <div v-if="r.meses.length === 1" class="dote-barras-periodo">
              <div v-for="k in KPIS.slice(0, 3)" :key="k.campo">
                <div class="d-flex flex-wrap justify-space-between mb-1">
                  <span>{{ k.rotulo }}</span>
                  <span class="dote-num" :class="k.classe">{{ formatMoney(r.totais[k.campo]) }}</span>
                </div>
                <v-progress-linear :model-value="(r.totais[k.campo] / maximoBarras) * 100" :color="k.cor" height="10" />
              </div>
            </div>
            <BarrasMensais v-else :meses="r.meses" />
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from './AlertaErro.vue';
import { computed, ref } from 'vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { relatorioApi, type FiltrosRelatorio } from '../api/relatorio';
import { useContaStore } from '../stores/conta';
import { formatData, isoDia } from '../utils/datas';
import { formatMoney } from '../utils/formatMoney';
import BarrasMensais from './BarrasMensais.vue';
import RelatorioExportacao from './RelatorioExportacao.vue';
import FiltrosExtrato from './FiltrosExtrato.vue';

const props = defineProps({ clienteId: { type: String, default: null } });

const KPIS = [
  { rotulo: 'entradas', campo: 'entradasCentavos', classe: 'text-success', cor: 'success' },
  { rotulo: 'saídas', campo: 'saidasCentavos', classe: 'text-error', cor: 'error' },
  { rotulo: 'rendimentos', campo: 'rendimentosCentavos', classe: 'text-neon-300', cor: 'neon-600' },
  { rotulo: 'resultado', campo: 'resultadoCentavos' },
];

const contaStore = useContaStore();
const datas = ref([]);
const categoria = ref(null);
const r = ref(null);
const hojeIso = computed(() => (contaStore.dataSistema ? isoDia(contaStore.dataSistema) : ''));
const filtros = ref<FiltrosRelatorio>({ clienteId: props.clienteId });
const maximoBarras = computed(() => Math.max(1, ...KPIS.slice(0, 3).map((k) => r.value?.totais[k.campo] ?? 0)));
const { carregando, erro, executar } = useAcao();

async function carregar() {
  if (carregando.value) return;
  const consulta = filtros.value;
  const relatorio = await executar(() => relatorioApi.obter(consulta));
  if (relatorio) r.value = relatorio;
}

function trocarPeriodo() {
  if (carregando.value) return;
  const [inicio, fim] = datas.value;
  filtros.value = { clienteId: props.clienteId, inicio, fim, categoria: categoria.value ?? undefined };
  return carregar();
}

aoAbrirTela(carregar);
</script>

<style scoped>
.dote-barras-periodo {
  display: grid;
  gap: 16px;
}
.dote-kpi {
  font-size: clamp(16px, 5vw, 22px);
  line-height: 1.3;
  white-space: nowrap;  
}
</style>
