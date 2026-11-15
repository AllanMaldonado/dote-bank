<template>
  <v-app>
    <template v-if="comMenu">
      <AdminShell v-if="admin" />
      <ClienteShell v-else />
    </template>
    <v-main v-else>
      <router-view />
    </v-main>
    <ToastContainer />
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminShell from './layouts/AdminShell.vue';
import ClienteShell from './layouts/ClienteShell.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useAuthStore } from './stores/auth';

const route = useRoute();
const auth = useAuthStore();
const comMenu = computed(() => !['landing', 'publico', 'pendente', undefined].includes(route.meta.acesso));
const admin = computed(() => auth.user?.perfil === 'admin');
</script>
