<template>
  <v-row>
    <v-col cols="12" md="7">
      <v-card class="pa-6 h-100">
        <div class="dote-label">data do sistema (simulada)</div>
        <div class="dote-data-sistema dote-glow dote-num">{{ config ? formatData(config.dataSistema) : '…' }}</div>
        <p class="text-muted text-body-2 mt-2">
          O tempo só anda aqui. A cada dia: os juros das caixinhas são acumulados, no dia 1 o rendimento do mês
          é creditado e as transferências agendadas do dia são executadas.
        </p>

        <AlertaErro :mensagem="erro" class="my-4" />

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            color="neon-950"
            :loading="avancando === 'dia'"
            :disabled="!!avancando"
            @click="avancar('dia', { dias: 1 })"
            >+1 dia</v-btn
          >
          <v-btn
            color="neon-950"
            :loading="avancando === 'semana'"
            :disabled="!!avancando"
            @click="avancar('semana', { dias: 7 })"
            >+7 dias</v-btn
          >
          <v-btn
            color="primary"
            class="dote-cta"
            :loading="avancando === 'mes'"
            :disabled="!!avancando"
            @click="avancar('mes', { meses: 1 })"
            >+1 mês</v-btn
          >
        </div>
        <div class="d-flex flex-wrap align-center ga-2 mt-4">
          <SeletorPeriodo v-model="datas" unico :minimo="amanha" rotulo-vazio="Avançar até…" :desabilitado="!!avancando" />
          <v-btn
            color="neon-950"
            :loading="avancando === 'ate'"
            :disabled="!ate || !!avancando"
            @click="avancar('ate', { ate })"
            >Avançar</v-btn
          >
        </div>

        <v-card v-if="resumo" color="surface-bright" class="pa-4 mt-6">
          <div class="dote-label mb-2">último avanço · {{ resumo.dias }} {{ resumo.dias === 1 ? 'dia' : 'dias' }}</div>
          <div class="text-body-2">{{ formatData(resumo.de) }} → {{ formatData(resumo.ate) }}</div>
          <div class="text-body-2">
            Transferências agendadas enviadas: <span class="text-neon-300">{{ resumo.recorrenciasExecutadas }}</span>
          </div>
          <div class="text-body-2">
            Transferências agendadas que falharam:
            <span :class="resumo.recorrenciasFalhas ? 'text-error' : ''">{{ resumo.recorrenciasFalhas }}</span>
          </div>
          <div class="text-body-2">
            Rendimentos creditados: <span class="dote-num">{{ formatMoney(resumo.rendimentosCentavos) }}</span>
          </div>
        </v-card>
      </v-card>
    </v-col>

    <v-col cols="12" md="5">
      <v-card class="pa-6 h-100">
        <h2 class="dote-title mb-1">&gt; rendimento</h2>
        <p class="text-muted text-body-2 mb-4">
          Só as caixinhas rendem, em % do Índice Points (o índice do banco de pontos). Juros simples diários; o saldo
          em conta não rende.
        </p>
        <v-form @submit.prevent="salvarTaxas">
          <v-text-field
            v-model.number="taxas.indicePointsAnual"
            label="Índice Points"
            type="number"
            step="0.01"
            min="0"
            max="100"
            suffix="% a.a."
          />
          <v-text-field
            v-model.number="taxas.percentualCaixinha"
            label="Caixinhas"
            type="number"
            step="1"
            min="0"
            max="500"
            suffix="% do índice"
            :hint="`= ${formatPercentual(efetiva(taxas.percentualCaixinha))} a.a.`"
            persistent-hint
            class="mb-4"
          />
          <v-btn type="submit" color="neon-950" :loading="carregando">Salvar</v-btn>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, reactive, ref } from 'vue';
import SeletorPeriodo from '../components/SeletorPeriodo.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { adminApi } from '../api/admin';
import { useContaStore } from '../stores/conta';
import { useToastStore } from '../stores/toast';
import { alvoDoRelogio, formatData } from '../utils/datas';
import { formatMoney, formatPercentual } from '../utils/formatMoney';

const contaStore = useContaStore();
const toast = useToastStore();
const config = ref(null);
const resumo = ref(null);
const datas = ref([]);
const ate = computed(() => datas.value[0] ?? '');
const amanha = computed(() => {
  if (!config.value) return undefined;
  const d = new Date(config.value.dataSistema);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
});
const avancando = ref(null);
const taxas = reactive({ indicePointsAnual: null, percentualCaixinha: null });
const efetiva = (percentual) => ((taxas.indicePointsAnual ?? 0) * (percentual ?? 0)) / 100;
const { carregando, erro, executar } = useAcao();

function aplicarConfig(c) {
  config.value = c;
  Object.assign(taxas, {
    indicePointsAnual: c.indicePointsAnual,
    percentualCaixinha: c.percentualCaixinha,
  });
}

async function avancar(nome, pedido) {
  if (avancando.value || !config.value) return;
  const alvo = alvoDoRelogio(config.value.dataSistema, pedido);
  avancando.value = nome;
  const r = await executar(async () => {
    try {
      return await adminApi.avancarRelogio({ ate: alvo });
    } catch (falha) {
      const atual = await adminApi.obterConfig().catch(() => null);
      if (atual) {
        aplicarConfig(atual);
        contaStore.dataSistema = atual.dataSistema;
        if (atual.dataSistema.slice(0, 10) >= alvo) return { config: atual, resumo: null };
      }
      throw falha;
    }
  });
  avancando.value = null;
  if (!r) return;
  aplicarConfig(r.config);
  datas.value = [];
  resumo.value = r.resumo;
  contaStore.dataSistema = r.config.dataSistema;
  toast.mostrar('Relógio avançado');
}

async function salvarTaxas() {
  const c = await executar(() => adminApi.atualizarTaxas(taxas));
  if (!c) return;
  aplicarConfig(c);
  toast.mostrar('Taxas atualizadas');
}

aoAbrirTela(() => executar(async () => aplicarConfig(await adminApi.obterConfig())));
</script>

<style scoped>
.dote-data-sistema {
  font-size: 44px;
  line-height: 1.1;
}
.dote-campo-data {
  max-width: 200px;
}
</style>
