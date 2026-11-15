<template>
  <v-alert v-if="mensagem" type="error" variant="tonal" density="compact" role="alert">{{
    mensagem
  }}</v-alert>
</template>

<script setup lang="ts">
defineProps<{ mensagem?: string }>();
</script>
