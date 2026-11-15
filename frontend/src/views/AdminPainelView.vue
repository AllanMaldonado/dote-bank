<template>
  <div>
    <AlertaErro :mensagem="erro" class="mb-4" />
    <v-skeleton-loader v-if="!p" type="card, card" color="surface" />

    <template v-else>
      <div class="text-muted text-body-2 mb-3">Data do sistema: {{ formatData(p.dataSistema) }}</div>

      <v-row dense>
        <v-col v-for="c in CLIENTES" :key="c.rotulo" cols="6" md="3">
          <v-card class="pa-4 h-100">
            <div class="dote-label">{{ c.rotulo }}</div>
            <div class="dote-kpi dote-num" :class="c.classe">{{ c.valor(p.clientes) }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense class="mt-1">
        <v-col v-for="k in DINHEIRO" :key="k.rotulo" cols="12" md="4">
          <v-card class="pa-4 h-100">
            <div class="dote-label">{{ k.rotulo }}</div>
            <div class="dote-kpi dote-num">{{ k.valor(p) }}</div>
            <div v-if="k.detalhe" class="text-muted text-body-2">{{ k.detalhe(p) }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="pa-5 mt-4">
        <h3 class="dote-subtitulo mb-3">Transferências por mês</h3>
        <v-table density="compact">
          <thead>
            <tr>
              <th class="dote-label">mês</th>
              <th class="dote-label text-right">pix</th>
              <th class="dote-label text-right">volume</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in p.porMes" :key="m.mes">
              <td>{{ formatMes(m.mes) }}</td>
              <td class="text-right dote-num">{{ m.quantidade }}</td>
              <td class="text-right dote-num">{{ formatMoney(m.volumeCentavos) }}</td>
            </tr>
          </tbody>
        </v-table>
        <p v-if="!p.porMes.length" class="text-muted mt-3 mb-0">Sem transferências no período.</p>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { ref } from 'vue';
import { adminApi } from '../api/admin';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { formatData, formatMes } from '../utils/datas';
import { formatMoney } from '../utils/formatMoney';

const CLIENTES = [
  { rotulo: 'clientes', classe: '', valor: (c) => c.total },
  { rotulo: 'pendentes', classe: 'text-warning', valor: (c) => c.pendente },
  { rotulo: 'ativos', classe: 'text-neon-300', valor: (c) => c.ativo },
  { rotulo: 'bloqueados ou rejeitados', classe: 'text-error', valor: (c) => c.bloqueado + c.rejeitado },
];

const DINHEIRO = [
  { rotulo: 'saldo em contas', valor: (p) => formatMoney(p.saldoTotalCentavos) },
  { rotulo: 'guardado em caixinhas', valor: (p) => formatMoney(p.caixinhasCentavos) },
  {
    rotulo: 'volume de transferências',
    valor: (p) => formatMoney(p.pix.volumeCentavos),
    detalhe: (p) => `${p.pix.quantidade} transferências`,
  },
];

const p = ref(null);
const { erro, executar } = useAcao();

aoAbrirTela(() => executar(async () => (p.value = await adminApi.painel())));
</script>

<style scoped>
.dote-kpi {
  font-size: 22px;
  line-height: 1.3;
}
</style>
