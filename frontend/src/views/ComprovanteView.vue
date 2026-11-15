<template>
  <v-row justify="center">
    <v-col cols="12" md="8" lg="6">
      <AlertaErro v-if="erro" :mensagem="erro" />
      <v-skeleton-loader v-else-if="!t" type="card" color="surface" />
      <v-card v-else class="pa-6 dote-comprovante">
        <div class="d-flex align-center mb-4">
          <div>
            <div class="dote-label">comprovante</div>
            <MarcaDote :altura="26" class="mt-1" />
          </div>
          <v-spacer />
          <v-chip v-if="t.status === 'falhou'" color="surface-bright" class="text-error">não enviado</v-chip>
          <v-icon v-else icon="mdi-check-circle-outline" color="primary" size="32" />
        </div>

        <div class="text-muted">{{ tituloDaTransacao(t) }}</div>
        <div class="dote-valor-grande dote-num mb-6">{{ formatMoney(t.valorCentavos) }}</div>

        <v-table density="compact">
          <tbody>
            <tr>
              <td class="dote-label">data</td>
              <td>{{ formatData(t.data) }}</td>
            </tr>
            <tr v-if="t.origem">
              <td class="dote-label">de</td>
              <td>{{ t.origem.nome }}</td>
            </tr>
            <tr v-if="t.destino">
              <td class="dote-label">para</td>
              <td>{{ t.destino.nome }}</td>
            </tr>
            <tr v-if="t.chaveDestino">
              <td class="dote-label">chave</td>
              <td class="dote-mono">{{ t.chaveDestino }}</td>
            </tr>
            <tr v-if="t.caixinha">
              <td class="dote-label">caixinha</td>
              <td>{{ t.caixinha }}</td>
            </tr>
            <tr v-if="t.categoria && t.tipo !== 'rendimento'">
              <td class="dote-label">categoria</td>
              <td>{{ t.categoria }}</td>
            </tr>
            <tr v-if="t.descricao">
              <td class="dote-label">mensagem</td>
              <td>{{ t.descricao }}</td>
            </tr>
            <tr>
              <td class="dote-label">código</td>
              <td class="dote-mono">{{ t.codigo }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex flex-wrap ga-2 mt-6 dote-nao-imprimir">
          <v-btn color="primary" class="dote-cta" prepend-icon="mdi-printer-outline" @click="imprimir"
            >Imprimir / salvar PDF</v-btn
          >
          <v-btn variant="text" color="neon-600" @click="router.back()">Voltar</v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import MarcaDote from '../components/MarcaDote.vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { transacoesApi } from '../api/transacoes';
import { formatData } from '../utils/datas';
import { formatMoney } from '../utils/formatMoney';
import { tituloDaTransacao } from '../utils/transacoes';

const route = useRoute();
const router = useRouter();
const t = ref(null);
const { erro, executar } = useAcao();

const imprimir = () => window.print();

aoAbrirTela(() => executar(async () => (t.value = await transacoesApi.comprovante(route.params.id))));
</script>

<style scoped></style>
