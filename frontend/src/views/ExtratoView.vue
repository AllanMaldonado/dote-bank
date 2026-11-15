<template>
  <div>
    <AbasSecao :abas="ABAS_EXTRATO" />
    <v-card class="pa-4 mb-4">
      <FiltrosExtrato
        v-model:busca="busca"
        v-model:categoria="categoria"
        v-model:datas="datas"
        com-busca
        :data-maxima="dataMaxima"
        :carregando="carregando"
        @aplicar="buscar(1)"
      >
        <template #meio>
          <div class="dote-tipos" role="group" aria-label="Tipo de movimentação">
            <v-chip
              v-for="t in TIPOS"
              color="surface-bright"
              size="default"
              :key="t.valor"
              :class="{ 'dote-chip-ativo': tipo === t.valor }"
              :aria-pressed="tipo === t.valor"
              @click="trocarTipo(t.valor)"
              >{{ t.rotulo }}</v-chip
            >
          </div>
        </template>
        <template #acoes>
          <RelatorioExportacao
            :obter="obterRelatorio"
            :filtros="{ inicio: datas[0], fim: datas[1], categoria }"
            :desabilitado="carregando"
          />
        </template>
      </FiltrosExtrato>
    </v-card>

    <AlertaErro :mensagem="erro" class="mb-4" />

    <v-card class="py-2" :loading="carregando && pronto" color="surface">
      <v-skeleton-loader v-if="!pronto" type="list-item-two-line@5" color="surface" />
      <template v-else-if="itens.length">
        <ExtratoItem v-for="t in itens" :key="t.id" v-bind="itemDoExtrato(t)" />
      </template>
      <p v-else class="text-muted pa-6 ma-0">Nada encontrado para este filtro.</p>
    </v-card>

    <div class="d-flex flex-wrap align-center justify-center ga-2 mt-4">
      <span class="text-muted text-body-2 flex-grow-1">{{ total }} {{ total === 1 ? 'movimentação' : 'movimentações' }}</span>
      <Paginacao
        v-if="paginas > 1"
        v-model="pagina"
        :length="paginas"
        density="comfortable"
        :total-visible="xs ? 3 : 5"
        @update:model-value="buscar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, ref } from 'vue';
import Paginacao from '../components/Paginacao.vue';
import { useDisplay } from 'vuetify';
import AbasSecao from '../components/AbasSecao.vue';
import ExtratoItem from '../components/ExtratoItem.vue';
import FiltrosExtrato from '../components/FiltrosExtrato.vue';
import RelatorioExportacao from '../components/RelatorioExportacao.vue';
import { relatorioApi } from '../api/relatorio';
import { useContaStore } from '../stores/conta';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useListaPaginada } from '../composables/useListaPaginada';
import { transacoesApi } from '../api/transacoes';
import { ABAS_EXTRATO } from '../utils/secoes';
import { itemDoExtrato } from '../utils/transacoes';

const LIMITE = 5;
const TIPOS = [
  { valor: '', rotulo: 'todas' },
  { valor: 'entrada', rotulo: 'entradas' },
  { valor: 'saida', rotulo: 'saídas' },
  { valor: 'caixinha', rotulo: 'caixinhas' },
];
const { xs } = useDisplay();
const tipo = ref('');
const categoria = ref(null);
const busca = ref('');
const datas = ref([]);
const conta = useContaStore();
const dataMaxima = computed(() => conta.dataSistema?.slice(0, 10));
const { itens, total, pagina, paginas, carregando, erro, buscar } = useListaPaginada(LIMITE, (pagina) =>
  transacoesApi.listar({
    tipo: tipo.value,
    categoria: categoria.value,
    busca: busca.value?.trim(),
    inicio: datas.value[0],
    fim: datas.value[1],
    pagina,
    limite: LIMITE,
  }),
);

function trocarTipo(valor) {
  tipo.value = valor;
  buscar(1);
}

const obterRelatorio = () =>
  relatorioApi.obter({ inicio: datas.value[0], fim: datas.value[1], categoria: categoria.value ?? undefined });

const pronto = aoAbrirTela(() => buscar());
</script>

<style scoped>
.dote-tipos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>


