<template>
  <v-tabs grow color="primary" density="comfortable" slider-color="primary" class="mb-5 dote-abas">
    <v-tab v-for="aba in abas" :key="aba.para" :to="aba.para" exact :ripple="false">{{ aba.titulo }}</v-tab>
  </v-tabs>
</template>

<script setup lang="ts">
defineProps<{ abas: { para: string; titulo: string }[] }>();
</script>
