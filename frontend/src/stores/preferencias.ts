import { defineStore } from 'pinia';
import { reactive, toRefs, watch } from 'vue';
import vuetify from '../plugins/vuetify';
import { privacidade } from '../utils/privacidade';

const CHAVE = 'dote:preferencias';
const TEMAS = { escuro: 'dote', claro: 'doteClaro' };

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? {};
  } catch {
    return {};
  }
}

export const usePreferenciasStore = defineStore('preferencias', () => {
  const salvas = ler();
  const estado = reactive({
    ocultarAoAbrir: Boolean(salvas.ocultarAoAbrir),
    tema: salvas.tema === 'claro' ? 'claro' : 'escuro',
    valoresOcultos: Boolean(salvas.ocultarAoAbrir),
  });

  watch(
    () => [estado.ocultarAoAbrir, estado.tema],
    ([ocultarAoAbrir, tema]) => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ ocultarAoAbrir, tema }));
      } catch {
      }
    },
  );

  watch(
    () => estado.tema,
    (tema) => {
      vuetify.theme.change(TEMAS[tema]);
    },
    { immediate: true },
  );

  watch(
    () => estado.valoresOcultos,
    (oculto) => {
      privacidade.oculto = oculto;
    },
    { immediate: true },
  );

  function definir(chave, valor) {
    estado[chave] = valor;
  }

  function alternarValores() {
    estado.valoresOcultos = !estado.valoresOcultos;
  }

  return { ...toRefs(estado), definir, alternarValores };
});
