<template>
  <div>
    <AbasSecao :abas="ABAS_EXTRATO" />
    <RelatorioPainel />
  </div>
</template>

<script setup lang="ts">
import AbasSecao from '../components/AbasSecao.vue';
import RelatorioPainel from '../components/RelatorioPainel.vue';
import { ABAS_EXTRATO } from '../utils/secoes';
</script>
