import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource/share-tech-mono';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './styles/main.css';

import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { useAuthStore } from './stores/auth';
import { usePreferenciasStore } from './stores/preferencias';

const app = createApp(App);
app.use(createPinia()).use(router).use(vuetify);

usePreferenciasStore();  
useAuthStore()
  .restaurar()
  .finally(() => app.mount('#app'));
