<template>
  <div>
    <v-tabs v-model="aba" grow color="primary" density="comfortable" slider-color="primary" class="mb-5 dote-abas">
      <v-tab value="fila" :ripple="false"
        >Fila de aprovação
        <v-chip v-if="fila.length" size="x-small" class="ml-2 text-warning" color="surface-bright">{{
          fila.length
        }}</v-chip></v-tab
      >
      <v-tab value="clientes" :ripple="false">Clientes</v-tab>
    </v-tabs>

    <AlertaErro :mensagem="erro || erroBusca" class="mb-4" />

    <v-card v-if="aba === 'fila'">
      <v-list bg-color="surface" class="py-0">
        <v-list-item v-for="u in fila" :key="u.id" class="py-3 dote-linha">
          <v-list-item-title>{{ u.nome }}</v-list-item-title>
          <v-list-item-subtitle
            >{{ u.email }} · CPF {{ cpf(u.cpf) }} · desde {{ formatData(u.criadoEm) }}</v-list-item-subtitle
          >
          <template #append>
            <v-btn
              color="primary"
              size="small"
              class="mr-2"
              :loading="emAcao === u.id + 'aprovar'"
              @click="acao(u, 'aprovar')"
              >Aprovar</v-btn
            >
            <v-btn
              variant="text"
              color="error"
              size="small"
              :loading="emAcao === u.id + 'rejeitar'"
              @click="acao(u, 'rejeitar')"
              >Rejeitar</v-btn
            >
          </template>
        </v-list-item>
        <p v-if="!fila.length" class="text-muted pa-6 ma-0">Fila vazia. Ninguém aguardando aprovação.</p>
      </v-list>
    </v-card>

    <template v-else>
      <v-card class="pa-4 mb-4">
        <div class="d-flex flex-wrap ga-3">
          <v-text-field
            v-model="busca"
            label="Buscar por nome, e-mail ou CPF"
            prepend-inner-icon="mdi-magnify"
            hide-details
            density="compact"
            clearable
            @update:model-value="buscarDepois"
          />
          <v-select
            v-model="status"
            :items="FILTROS"
            label="Status"
            hide-details
            density="compact"
            class="dote-filtro"
            @update:model-value="buscar(1)"
          />
        </div>
      </v-card>
      <v-card>
        <v-table hover>
          <thead>
            <tr>
              <th class="dote-label">cliente</th>
              <th class="dote-label">status</th>
              <th class="dote-label text-right">saldo</th>
              <th class="dote-label text-right">ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in clientes" :key="u.id">
              <td>
                <router-link :to="`/admin/clientes/${u.id}`" class="dote-link">{{ u.nome }}</router-link>
                <div class="text-caption text-muted">{{ u.email }}</div>
              </td>
              <td>
                <v-chip color="surface-bright" :class="STATUS_CONTA[u.status].classe">{{
                  STATUS_CONTA[u.status].rotulo
                }}</v-chip>
              </td>
              <td class="text-right dote-num">{{ formatMoney(u.saldoCentavos ?? 0) }}</td>
              <td class="text-right text-no-wrap">
                <v-btn
                  icon="mdi-chart-bar"
                  variant="text"
                  size="small"
                  color="neon-600"
                  :to="`/admin/clientes/${u.id}`"
                  aria-label="Ver cliente e relatório"
                />
                <v-btn
                  v-if="u.status === 'ativo'"
                  icon="mdi-lock-outline"
                  variant="text"
                  size="small"
                  color="error"
                  aria-label="Bloquear"
                  @click="acao(u, 'bloquear')"
                />
                <v-btn
                  v-if="u.status === 'bloqueado'"
                  icon="mdi-lock-open-outline"
                  variant="text"
                  size="small"
                  color="neon-600"
                  aria-label="Desbloquear"
                  @click="acao(u, 'desbloquear')"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <p v-if="!clientes.length && !carregando && !buscando" class="text-muted pa-6 ma-0">Nenhum cliente encontrado.</p>
      </v-card>
      <div class="d-flex justify-space-between align-center mt-4">
        <span class="text-muted text-body-2">{{ total }} clientes</span>
        <Paginacao
          v-if="paginas > 1"
          v-model="pagina"
          :length="paginas"
          density="comfortable"
          total-visible="5"
          @update:model-value="buscar"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { onDeactivated, onUnmounted, ref } from 'vue';
import Paginacao from '../components/Paginacao.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useListaPaginada } from '../composables/useListaPaginada';
import { useAcao } from '../composables/useAcao';
import { adminApi } from '../api/admin';
import { useToastStore } from '../stores/toast';
import { STATUS_CONTA } from '../utils/constantes';
import { formatData } from '../utils/datas';
import { formatMoney } from '../utils/formatMoney';

const FILTROS = [
  { title: 'todos', value: '' },
  { title: 'ativos', value: 'ativo' },
  { title: 'pendentes', value: 'pendente' },
  { title: 'bloqueados', value: 'bloqueado' },
  { title: 'rejeitados', value: 'rejeitado' },
];
const LIMITE = 20;
const MENSAGENS_ACAO = {
  aprovar: 'Cliente aprovado',
  rejeitar: 'Cliente rejeitado',
  bloquear: 'Cliente bloqueado',
  desbloquear: 'Cliente desbloqueado',
};
const aba = ref('fila');
const fila = ref([]);
const busca = ref('');
const status = ref('');
const emAcao = ref(null);
const toast = useToastStore();
const { carregando, erro, executar } = useAcao();

const cpf = (c) => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

const carregarFila = () =>
  executar(async () => (fila.value = (await adminApi.listarClientes({ status: 'pendente', limite: 100 })).itens));

const { itens: clientes, total, pagina, paginas, buscar, carregando: buscando, erro: erroBusca } = useListaPaginada(
  LIMITE,
  (pagina) => adminApi.listarClientes({ busca: busca.value, status: status.value, pagina, limite: LIMITE }),
);

let espera: ReturnType<typeof setTimeout>;
onUnmounted(() => clearTimeout(espera));
onDeactivated(() => clearTimeout(espera));
function buscarDepois() {
  clearTimeout(espera);
  espera = setTimeout(() => buscar(1), 300);
}

async function acao(u, nome) {
  emAcao.value = u.id + nome;
  const ok = await executar(() => adminApi.mudarStatus(u.id, nome));
  if (ok) toast.mostrar(MENSAGENS_ACAO[nome] ?? 'Status atualizado');
  emAcao.value = null;
  await Promise.all([carregarFila(), buscar()]);
}

let abaDefinida = false;
aoAbrirTela(async () => {
  await Promise.all([carregarFila(), buscar()]);
  if (abaDefinida) return;
  abaDefinida = true;
  if (!fila.value.length) aba.value = 'clientes';  
});
</script>

<style scoped>
.dote-linha + .dote-linha {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
.dote-filtro {
  max-width: 180px;
}
</style>
