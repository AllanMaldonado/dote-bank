<template>
  <v-navigation-drawer v-model="aberto" :permanent="desktop" :temporary="!desktop" color="surface" width="232">
    <div class="pa-5">
      <router-link to="/admin" aria-label="DOTE, clientes"
        ><MarcaDote :altura="30"
      /></router-link>
      <div class="dote-label mt-1">administração</div>
    </div>
    <v-list nav density="comfortable" bg-color="surface">
      <v-list-item
        v-for="item in ITENS"
        :key="item.para"
        :to="item.para"
        :prepend-icon="item.icone"
        :title="item.titulo"
        :exact="item.exato"
        color="primary"
        rounded="sm"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar flat color="background" density="comfortable">
    <v-app-bar-nav-icon v-if="!desktop" aria-label="Abrir menu" @click="aberto = !aberto" />
    <v-app-bar-title class="dote-title">{{ route.meta.titulo }}</v-app-bar-title>
    <template #append>
      <v-chip v-if="contaStore.dataSistema" class="mr-2" prepend-icon="mdi-calendar-clock" to="/admin/sistema">
        {{ formatData(contaStore.dataSistema) }}
      </v-chip>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon aria-label="Conta">
            <v-icon icon="mdi-account-circle-outline" />
          </v-btn>
        </template>
        <v-list bg-color="surface-bright" min-width="200">
          <v-list-item :title="auth.user?.nome" :subtitle="auth.user?.email" />
          <v-divider />
          <v-list-item
            :prepend-icon="preferencias.tema === 'claro' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
            :title="preferencias.tema === 'claro' ? 'Tema escuro' : 'Tema claro'"
            @click="preferencias.definir('tema', preferencias.tema === 'claro' ? 'escuro' : 'claro')"
          />
          <v-list-item prepend-icon="mdi-logout" title="Sair" @click="encerrar" />
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>

  <v-main>
    <v-container class="dote-pagina py-6">
      <router-view v-slot="{ Component, route: rota }">
        <keep-alive :max="8">
          <component :is="Component" :key="rota.path" />
        </keep-alive>
      </router-view>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import MarcaDote from '../components/MarcaDote.vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';
import { usePreferenciasStore } from '../stores/preferencias';
import { formatData } from '../utils/datas';

const ITENS = [
  { titulo: 'Painel', para: '/admin/painel', icone: 'mdi-view-dashboard-outline' },
  { titulo: 'Clientes', para: '/admin', icone: 'mdi-account-group-outline', exato: true },
  { titulo: 'Sistema', para: '/admin/sistema', icone: 'mdi-calendar-clock' },
];

const auth = useAuthStore();
const contaStore = useContaStore();
const preferencias = usePreferenciasStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp: desktop } = useDisplay();
const aberto = ref(desktop.value);
watch(desktop, (d) => (aberto.value = d));

async function encerrar() {
  await auth.logout();
  contaStore.limpar();
  router.push('/login');
}
</script>

<style scoped></style>
