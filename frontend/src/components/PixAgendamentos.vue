<template>
  <v-card class="dote-agendamentos">
    <div class="dote-agendados-topo pa-5">
      <div class="min-w-0">
        <h2 class="dote-subtitulo">Transferências agendadas</h2>
        <p class="text-muted text-body-2 ma-0">Enviados todo mês no dia escolhido.</p>
      </div>
      <v-btn color="neon-950" size="small" prepend-icon="mdi-plus" @click="abrir()">Agendar</v-btn>
    </div>

    <v-divider />
    <AlertaErro :mensagem="erro" class="mb-4" />

    <v-list bg-color="surface" class="py-0">
      <v-list-item v-for="r in recorrencias" :key="r.id" class="py-3 dote-linha">
        <template #prepend>
          <v-avatar :color="r.ativa ? 'neon-950' : 'surface-bright'" rounded="sm" size="40" class="mr-3">
            <span class="text-body-2" :class="r.ativa ? 'text-neon-300' : 'text-muted'">{{ r.diaDoMes }}</span>
          </v-avatar>
        </template>
        <v-list-item-title
          >{{ r.descricao }} <span class="text-muted">· {{ r.destinatario }}</span></v-list-item-title
        >
        <v-list-item-subtitle>
          todo dia {{ r.diaDoMes }} · {{ r.categoria }}
          <template v-if="r.ultimaExecucao">
            · última {{ formatData(r.ultimaExecucao) }}
            <span :class="r.ultimoStatus === 'falhou' ? 'text-error' : 'text-neon-300'">{{
              r.ultimoStatus === 'falhou' ? 'não enviado' : 'enviado'
            }}</span>
          </template>
        </v-list-item-subtitle>
        <div class="d-flex flex-wrap align-center ga-1 mt-2">
          <span class="dote-num mr-auto">{{ formatMoney(r.valorCentavos) }}</span>
          <v-switch
            :model-value="r.ativa"
            color="primary"
            hide-details
            density="compact"
            :aria-label="r.ativa ? 'Pausar' : 'Reativar'"
            @update:model-value="alternar(r, $event)"
          />
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            color="neon-600"
            aria-label="Editar"
            @click="abrir(r)"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="error"
            aria-label="Excluir"
            @click="aExcluir = r"
          />
        </div>
      </v-list-item>
      <p v-if="!recorrencias.length && !carregando" class="text-muted pa-6 ma-0">
        Nenhum Transferência agendada. Ex.: aluguel todo dia 5.
      </p>
    </v-list>

    <v-dialog v-model="form.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">{{ form.id ? 'Editar agendamento' : 'Novo agendamento' }}</h3>
        <AlertaErro :mensagem="erro" class="mb-4" />
        <v-form @submit.prevent="salvar">
          <v-text-field v-model="form.descricao" label="Descrição" placeholder="Aluguel" maxlength="140" />
          <v-text-field
            v-model="form.chave"
            label="Chave de transferência do destinatário"
            :hint="form.id ? 'deixe como está para manter' : ''"
            persistent-hint
          />
          <CampoValor v-model="form.valorCentavos" class="mt-2" />
          <div class="d-flex ga-3">
            <v-select v-model="form.diaDoMes" :items="DIAS" label="Dia do mês" />
            <v-select v-model="form.categoria" :items="CATEGORIAS" label="Categoria" />
          </div>
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="form.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="carregando" :disabled="!form.valorCentavos || !form.chave"
              >Salvar</v-btn
            >
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <DialogoConfirmar
      :model-value="!!aExcluir"
      titulo="Excluir agendamento?"
      :mensagem="
        aExcluir
          ? `${aExcluir.descricao}: ${formatMoney(aExcluir.valorCentavos)} todo dia ${aExcluir.diaDoMes}.`
          : ''
      "
      acao="Excluir"
      perigo
      :carregando="carregando"
      @update:model-value="aExcluir = null"
      @confirmar="excluir"
    />
  </v-card>
</template>

<script setup lang="ts">
import AlertaErro from './AlertaErro.vue';
import { reactive, ref } from 'vue';
import CampoValor from './CampoValor.vue';
import DialogoConfirmar from './DialogoConfirmar.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { pixApi } from '../api/pix';
import { useToastStore } from '../stores/toast';
import { CATEGORIAS } from '../utils/constantes';
import { formatData } from '../utils/datas';
import { formatMoney } from '../utils/formatMoney';

const DIAS = Array.from({ length: 28 }, (_, i) => i + 1);  
const recorrencias = ref([]);
const aExcluir = ref(null);
const form = reactive({
  aberto: false,
  id: null,
  descricao: '',
  chave: '',
  valorCentavos: null,
  diaDoMes: 5,
  categoria: 'Contas',
});
const toast = useToastStore();
const { carregando, erro, executar } = useAcao();

const carregar = () => executar(async () => (recorrencias.value = (await pixApi.listarAgendamentos()).itens));

function abrir(r = undefined) {
  erro.value = '';
  Object.assign(form, {
    aberto: true,
    id: r?.id ?? null,
    descricao: r?.descricao ?? '',
    chave: r?.chaveDestino ?? '',
    valorCentavos: r?.valorCentavos ?? null,
    diaDoMes: r?.diaDoMes ?? 5,
    categoria: r?.categoria ?? 'Contas',
  });
}

async function salvar() {
  const dados = {
    descricao: form.descricao,
    chave: form.chave,
    valorCentavos: form.valorCentavos,
    diaDoMes: form.diaDoMes,
    categoria: form.categoria,
  };
  const ok = await executar(() =>
    form.id ? pixApi.atualizarAgendamento(form.id, dados) : pixApi.criarAgendamento(dados),
  );
  if (!ok) return;
  form.aberto = false;
  toast.mostrar('Agendamento salvo');
  carregar();
}

async function alternar(r, ativa) {
  const ok = await executar(() => pixApi.definirAgendamentoAtivo(r.id, ativa));
  if (ok !== undefined) toast.mostrar(ativa ? 'Agendamento ativado' : 'Agendamento pausado');
  carregar();
}

async function excluir() {
  const ok = await executar(() => pixApi.excluirAgendamento(aExcluir.value.id));
  if (ok !== undefined) toast.mostrar('Agendamento excluído');
  aExcluir.value = null;
  carregar();
}

aoAbrirTela(carregar);
</script>

<style scoped>
.dote-agendados-topo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.dote-linha + .dote-linha {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
</style>
