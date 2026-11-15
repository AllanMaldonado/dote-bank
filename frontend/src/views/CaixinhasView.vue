<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-3 mb-5">
      <div class="text-muted text-body-2 flex-grow-1">
        Rendem
        <span class="text-neon-300">{{ formatPercentual(conta.resumo?.percentualCaixinha) }} do Índice Points</span>
        ({{ formatPercentual(conta.resumo?.taxaCaixinhaAnual) }} a.a.) · resgate quando quiser
      </div>
      <v-btn
        color="primary"
        class="dote-cta"
        prepend-icon="mdi-plus"
        :disabled="noLimite"
        :title="noLimite ? `Limite de ${LIMITE_CAIXINHAS} caixinhas` : undefined"
        @click="abrirEdicao()"
        >Nova caixinha</v-btn
      >
    </div>

    <AlertaErro :mensagem="erro" class="mb-4" />

    <div class="dote-grade-caixinhas">
      <div v-for="c in caixinhas" :key="c.id">
        <v-card class="pa-4 h-100 d-flex flex-column">
          <div class="d-flex align-center">
            <v-icon icon="mdi-piggy-bank-outline" color="neon-600" class="mr-2" />
            <span class="text-body-1">{{ c.nome }}</span>
            <v-chip v-if="c.metaAtingida" prepend-icon="mdi-trophy-outline" class="ml-2">meta!</v-chip>
            <v-spacer />
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              color="neon-600"
              aria-label="Editar caixinha"
              @click="abrirEdicao(c)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              aria-label="Excluir caixinha"
              @click="aExcluir = c"
            />
          </div>
          <div class="dote-caixinha-valor dote-num my-2">{{ formatMoney(c.saldoCentavos) }}</div>
          <template v-if="c.metaCentavos">
            <v-progress-linear :model-value="c.progresso" />
            <div class="d-flex justify-space-between text-caption mt-1">
              <span class="text-neon-300">{{ c.progresso }}%</span>
              <span class="text-muted dote-num">meta {{ formatMoney(c.metaCentavos) }}</span>
            </div>
          </template>
          <div v-else class="text-caption text-muted">sem meta</div>
          <v-spacer />
          <div class="d-flex flex-wrap ga-1 mt-3">
            <v-btn color="neon-950" size="small" prepend-icon="mdi-arrow-down" @click="abrirMovimento(c, 'guardar')"
              >Guardar</v-btn
            >
            <v-btn
              color="neon-950"
              size="small"
              prepend-icon="mdi-arrow-up"
              :disabled="!c.saldoCentavos"
              @click="abrirMovimento(c, 'resgatar')"
              >Resgatar</v-btn
            >
          </div>
        </v-card>
      </div>
      <v-card v-if="!caixinhas.length && !carregando" class="pa-6 text-muted dote-grade-vazia">
        Nenhuma caixinha ainda. Crie uma para separar seus pontos por objetivo.
      </v-card>
    </div>

    <div class="dote-contador-caixinhas" :class="{ 'dote-contador-caixinhas--cheio': noLimite }" role="status">
      <span class="dote-num">{{ caixinhas.length }}/{{ LIMITE_CAIXINHAS }}</span> caixinhas
    </div>

    <v-dialog v-model="edicao.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">{{ edicao.id ? 'Editar caixinha' : 'Nova caixinha' }}</h3>
        <v-form @submit.prevent="salvar">
          <v-text-field v-model="edicao.nome" label="Nome" maxlength="40" :rules="[obrigatorio]" autofocus />
          <CampoValor v-model="edicao.metaCentavos" label="Meta (opcional)" />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="edicao.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="carregando">Salvar</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="movimento.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-1">
          {{ movimento.acao === 'guardar' ? 'Guardar em' : 'Resgatar de' }} {{ movimento.caixinha?.nome }}
        </h3>
        <p class="text-muted text-body-2 mb-4">
          <template v-if="movimento.acao === 'guardar'"
            >Saldo em conta: {{ conta.resumo ? formatMoney(conta.resumo.saldoCentavos) : '—' }}</template
          >
          <template v-else>Na caixinha: {{ formatMoney(movimento.caixinha?.saldoCentavos ?? 0) }}</template>
        </p>
        <v-form @submit.prevent="movimentar">
          <CampoValor v-model="movimento.valorCentavos" autofocus />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="movimento.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="carregando" :disabled="!movimento.valorCentavos"
              >Confirmar</v-btn
            >
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <DialogoConfirmar
      :model-value="!!aExcluir"
      titulo="Excluir caixinha?"
      :mensagem="
        aExcluir?.saldoCentavos ? `${formatMoney(aExcluir.saldoCentavos)} voltam para a sua conta.` : 'Ela está vazia.'
      "
      acao="Excluir"
      perigo
      :carregando="carregando"
      @update:model-value="aExcluir = null"
      @confirmar="excluir"
    />
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, reactive, ref } from 'vue';
import CampoValor from '../components/CampoValor.vue';
import DialogoConfirmar from '../components/DialogoConfirmar.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { caixinhasApi } from '../api/caixinhas';
import { useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';
import { useToastStore } from '../stores/toast';
import { formatMoney, formatPercentual } from '../utils/formatMoney';
import { LIMITE_CAIXINHAS } from '../utils/constantes';
import { obrigatorio } from '../utils/regrasForm';

const auth = useAuthStore();
const conta = useContaStore();
const toast = useToastStore();
const caixinhas = ref([]);
const noLimite = computed(() => caixinhas.value.length >= LIMITE_CAIXINHAS);
const aExcluir = ref(null);
const edicao = reactive({ aberto: false, id: null, nome: '', metaCentavos: null });
const movimento = reactive({ aberto: false, acao: 'guardar', caixinha: null, valorCentavos: null });
const { carregando, erro, executar } = useAcao();

const carregarLista = () => executar(async () => (caixinhas.value = (await caixinhasApi.listar()).itens));

async function recarregar() {
  await carregarLista();
  await conta.atualizar(auth.user);
}

function abrirEdicao(c = undefined) {
  Object.assign(edicao, {
    aberto: true,
    id: c?.id ?? null,
    nome: c?.nome ?? '',
    metaCentavos: c?.metaCentavos ?? null,
  });
}

function abrirMovimento(caixinha, acao) {
  Object.assign(movimento, { aberto: true, acao, caixinha, valorCentavos: null });
}

async function salvar(evento) {
  if (!(await evento).valid) return;
  const dados = { nome: edicao.nome, metaCentavos: edicao.metaCentavos };
  const ok = await executar(() => (edicao.id ? caixinhasApi.atualizar(edicao.id, dados) : caixinhasApi.criar(dados)));
  if (!ok) return;
  edicao.aberto = false;
  toast.mostrar('Caixinha salva');
  await recarregar();
}

async function movimentar() {
  const ok = await executar(() => caixinhasApi[movimento.acao](movimento.caixinha.id, movimento.valorCentavos));
  movimento.aberto = false;
  if (ok) {
    toast.mostrar(movimento.acao === 'guardar' ? 'Valor guardado' : 'Valor resgatado');
    recarregar();
  }
}

async function excluir() {
  const ok = await executar(() => caixinhasApi.excluir(aExcluir.value.id));
  if (ok !== undefined) toast.mostrar('Caixinha excluída');
  aExcluir.value = null;
  recarregar();
}

aoAbrirTela(carregarLista);  
</script>

<style scoped>
.dote-grade-caixinhas {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.dote-contador-caixinhas {
  position: fixed;
  z-index: 1004;
  left: 50%;
  bottom: calc(80px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  border-radius: 22px;
  background: rgb(var(--v-theme-surface-bright));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
  color: rgb(var(--v-theme-muted));
  font-size: 14px;
  white-space: nowrap;
}
.dote-contador-caixinhas .dote-num {
  color: rgb(var(--v-theme-on-surface));
}
.dote-contador-caixinhas--cheio .dote-num {
  color: rgb(var(--v-theme-warning));
}
@media (min-width: 960px) {
  .dote-contador-caixinhas {
    bottom: 20px;
  }
}
.dote-grade-vazia {
  grid-column: 1 / -1;
}
.dote-caixinha-valor {
  font-size: 26px;
  line-height: 1.2;
}
@media (min-width: 600px) {
  .dote-grade-caixinhas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1100px) {
  .dote-grade-caixinhas {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
