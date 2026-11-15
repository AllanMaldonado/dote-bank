<template>
  <router-link :to="to" class="dote-linha-conta">
    <div>
      <div class="dote-secao-titulo">Conta</div>
      <div class="dote-saldo dote-num">{{ saldoCentavos === null ? '—' : formatMoney(saldoCentavos) }}</div>
    </div>
    <v-icon icon="mdi-chevron-right" color="muted" />
  </router-link>
</template>

<script setup lang="ts">
import { formatMoney } from '../utils/formatMoney';

withDefaults(defineProps<{ saldoCentavos: number | null; to?: string }>(), { to: '/extrato' });
</script>

<style scoped>
.dote-linha-conta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}
.dote-saldo {
  font-size: 26px;
  line-height: 1.3;
  margin: 2px 0;
}
</style>
