<template>
  <div class="dote-home">
    <section class="dote-faixa">
      <FundoMatrix v-if="!desktop" :key="preferencias.tema" />
      <div class="dote-faixa-conteudo">
        <h1 class="dote-saudacao">Olá, {{ primeiroNome }}</h1>
      </div>
    </section>

    <div class="dote-corpo">
      <section class="dote-painel">
        <SaldoCard :saldo-centavos="conta.resumo?.saldoCentavos ?? null" />
        <div class="dote-operacoes">
          <v-btn color="primary" class="dote-cta" :prepend-icon="IconeTransferencia" to="/transferencias">Transferir</v-btn>
          <v-btn variant="text" color="neon-300" prepend-icon="mdi-receipt-text-outline" to="/extrato">Extrato</v-btn>
        </div>
      </section>

      <section class="dote-card dote-caixinha">
        <div class="dote-linha mb-5">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-piggy-bank-outline" color="neon-300" />
            <h2 class="dote-secao-titulo">Caixinha</h2>
          </div>
          <v-btn variant="text" color="neon-300" size="small" append-icon="mdi-chevron-right" to="/caixinhas">{{
            maior ? 'Ver minhas caixinhas' : 'Criar caixinha'
          }}</v-btn>
        </div>
        <v-skeleton-loader v-if="!pronto" type="list-item-two-line" color="surface" />
        <template v-else-if="maior">
          <div class="text-muted text-body-2">{{ maior.nome }}</div>
          <div class="dote-caixinha-valor dote-num">{{ formatMoney(maior.saldoCentavos) }}</div>
          <div v-if="maior.metaCentavos" class="dote-caixinha-progresso">
            <v-progress-linear :model-value="maior.progresso" />
            <span class="text-neon-300 text-caption">{{ maior.progresso }}%</span>
          </div>
        </template>
        <p v-else class="text-muted text-body-2 ma-0">Você ainda não tem caixinhas.</p>
      </section>

      <section class="dote-card dote-movimentacoes">
        <router-link to="/extrato" class="dote-linha mb-3">
          <div class="dote-secao-titulo">Últimas movimentações</div>
          <v-icon icon="mdi-chevron-right" color="muted" />
        </router-link>
        <AlertaErro :mensagem="erro" />
        <v-skeleton-loader v-if="!pronto" type="list-item-two-line@5" color="surface" />
        <div v-else-if="itens.length" class="dote-lista-sem-fundo">
          <ExtratoItem v-for="t in itens" :key="t.id" v-bind="itemDoExtrato(t)" />
        </div>
        <p v-else class="text-muted ma-0">Nenhuma movimentação ainda.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { caixinhasApi } from '../api/caixinhas';
import { transacoesApi } from '../api/transacoes';
import ExtratoItem from '../components/ExtratoItem.vue';
import FundoMatrix from '../components/FundoMatrix.vue';
import IconeTransferencia from '../components/IconeTransferencia.vue';
import SaldoCard from '../components/SaldoCard.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';
import { usePreferenciasStore } from '../stores/preferencias';
import { itemDoExtrato } from '../utils/transacoes';
import { formatMoney } from '../utils/formatMoney';

const auth = useAuthStore();
const conta = useContaStore();
const preferencias = usePreferenciasStore();
const { mdAndUp: desktop } = useDisplay();

const nome = computed(() => auth.user?.nome ?? '');
const primeiroNome = computed(() => nome.value.split(' ')[0]);
const itens = ref([]);
const caixinhas = ref([]);
const maior = computed(() =>
  caixinhas.value.reduce((a, c) => (!a || c.saldoCentavos > a.saldoCentavos ? c : a), null),
);
const { erro, executar } = useAcao();
const pronto = aoAbrirTela(() =>
  executar(async () => {
    const [extrato, lista] = await Promise.all([transacoesApi.listar({ limite: 5 }), caixinhasApi.listar()]);
    itens.value = extrato.itens;
    caixinhas.value = lista.itens;
  }),
);
</script>

<style scoped>
.dote-faixa {
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  padding: 28px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
}
.dote-faixa-conteudo {
  position: relative;
}
.dote-saudacao {
  font-size: 24px;
  font-weight: 400;
  margin: 0;
}
.dote-corpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dote-painel {
  position: relative;
  padding: 20px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow:
    0 0 0 1px rgb(var(--v-theme-outline)),
    0 12px 32px rgba(var(--v-theme-background), 0.6);
}
.dote-card {
  padding: 20px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
}
.dote-caixinha-progresso {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.dote-secao-titulo {
  font-size: 17px;
}
.dote-linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}
.dote-operacoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.dote-caixinha-valor {
  font-size: 26px;
  line-height: 1.3;
  margin-top: 4px;
}

@media (min-width: 960px) {
  .dote-faixa {
    margin-bottom: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 12px 0 28px;
  }
  .dote-saudacao {
    margin: 0;
    font-size: 36px;
  }
  .dote-corpo {
    display: grid;
    grid-template-columns: minmax(290px, 2fr) minmax(0, 3fr);
    grid-template-areas: 'saldo extrato' 'caixinha extrato';
    grid-template-rows: auto 1fr;
    gap: 20px 24px;
    padding: 0;
  }
  .dote-painel,
  .dote-card {
    margin: 0;
    padding: 24px;
  }
  .dote-painel {
    grid-area: saldo;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-outline));
  }
  .dote-caixinha {
    grid-area: caixinha;
  }
  .dote-movimentacoes {
    grid-area: extrato;
  }
  .dote-painel :deep(.dote-saldo) {
    font-size: 36px;
  }
}

.dote-lista-sem-fundo :deep(.v-list-item) {
  padding-inline: 0 !important;
}
</style>
