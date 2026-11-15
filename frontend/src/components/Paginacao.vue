<template>
  <v-pagination v-model="pagina">
    <template #item="{ page, isActive, props }">
      <span v-if="props.ellipsis" class="dote-pagina-reticencias" aria-hidden="true">…</span>
      <v-btn
        v-else
        v-bind="props"
        :class="['dote-numero-pagina', { 'dote-numero-pagina--atual': isActive }]"
        variant="flat"
        :ripple="false"
      >
        {{ page }}
      </v-btn>
    </template>
  </v-pagination>
</template>

<script setup lang="ts">
const pagina = defineModel({ type: Number, required: true });
</script>

<style scoped>
.dote-pagina-reticencias {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 100%;
  color: rgb(var(--v-theme-muted));
  background: transparent;
}
.v-btn.dote-numero-pagina {
  background-color: transparent;
  color: rgb(var(--v-theme-on-surface));
}
.v-btn.dote-numero-pagina--atual {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.dote-numero-pagina--atual :deep(.v-btn__overlay) {
  display: none;
}
.dote-numero-pagina:focus-visible {
  outline: 2px solid rgb(var(--v-theme-on-surface));
  outline-offset: 2px;
}
</style>
