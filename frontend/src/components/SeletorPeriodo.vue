<template>
  <v-dialog v-model="aberto" max-width="560" scrollable>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        class="dote-filtro-botao"
        :class="{ 'dote-filtro-botao--ativo': periodo.length > 0 || aberto }"
        prepend-icon="mdi-calendar-range"
        :disabled="desabilitado"
        :aria-label="`Período: ${rotulo}`"
      >
        {{ rotulo }}
      </v-btn>
    </template>
    <v-card>
      <div class="d-flex align-center justify-space-between px-5 pt-4">
        <h2 class="dote-subtitulo">{{ unico ? 'Escolha a data' : 'Escolha o período' }}</h2>
        <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="aberto = false" />
      </div>

      <v-card-text class="pt-2">
        <div v-if="!unico" class="d-flex flex-wrap ga-2 mb-4">
          <v-chip
            color="surface-bright"
            v-for="a in atalhos"
            :key="a.rotulo"
            :class="{ 'dote-chip-ativo': inicio === a.inicio && fim === a.fim }"
            @click="usarAtalho(a)"
            >{{ a.rotulo }}</v-chip
          >
        </div>

        <div v-if="unico" class="dote-etapas dote-etapas--unica" role="group" aria-label="Data escolhida">
          <div class="dote-etapa dote-etapa--atual">
            <v-icon icon="mdi-calendar" color="neon-300" />
            <span>
              <span class="dote-label d-block">data escolhida</span>
              <span class="dote-num">{{ inicio ? formatData(inicio) : '—' }}</span>
            </span>
          </div>
        </div>
        <p v-if="unico" class="dote-dica" aria-live="polite">
          {{ inicio ? 'Pronto. Toque em "Escolher data".' : 'Toque no dia desejado.' }}
        </p>

        <div v-else class="dote-etapas" role="group" aria-label="Datas do período">
          <button
            type="button"
            class="dote-etapa"
            :class="{ 'dote-etapa--atual': etapa === 'inicio' }"
            @click="etapa = 'inicio'"
          >
            <span class="dote-etapa-numero">1</span>
            <span>
              <span class="dote-label d-block">data inicial</span>
              <span class="dote-num">{{ inicio ? formatData(inicio) : '—' }}</span>
            </span>
          </button>
          <v-icon icon="mdi-arrow-right" color="muted" />
          <button
            type="button"
            class="dote-etapa"
            :class="{ 'dote-etapa--atual': etapa === 'fim' }"
            :disabled="!inicio"
            @click="etapa = 'fim'"
          >
            <span class="dote-etapa-numero">2</span>
            <span>
              <span class="dote-label d-block">data final</span>
              <span class="dote-num">{{ fim ? formatData(fim) : '—' }}</span>
            </span>
          </button>
        </div>
        <p v-if="!unico" class="dote-dica" aria-live="polite">{{ dica }}</p>

        <v-date-picker
          :model-value="destaque"
          :multiple="unico ? false : 'range'"
          :min="unico ? minimo || undefined : etapa === 'fim' ? inicio : undefined"
          :max="maximo || undefined"
          :month="mes"
          :year="ano"
          hide-header
          show-adjacent-months
          color="primary"
          bg-color="surface"
          width="100%"
          class="dote-calendario"
          @update:model-value="selecionar"
        />
      </v-card-text>

      <v-card-actions class="px-5 pb-4 flex-wrap ga-2">
        <v-btn variant="text" color="muted" @click="limpar">Limpar</v-btn>
        <v-spacer />
        <v-btn color="primary" class="dote-cta" :disabled="!inicio || (!unico && !fim)" @click="confirmar">{{
          unico ? 'Escolher data' : 'Aplicar período'
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatData } from '../utils/datas';

const props = defineProps({
  maximo: String,  
  minimo: String,  
  unico: Boolean,  
  desabilitado: Boolean,
  rotuloVazio: { type: String, default: 'Todo o período' },
});
const periodo = defineModel<string[]>({ default: () => [] });
const aberto = ref(false);
const etapa = ref('inicio');
const inicio = ref('');
const fim = ref('');

const paraIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const paraData = (iso) => new Date(`${iso}T00:00:00`);

const hoje = computed(() => props.maximo || paraIso(new Date()));
const atalhos = computed(() => {
  const h = paraData(hoje.value);
  const menos = (dias) => paraIso(new Date(h.getFullYear(), h.getMonth(), h.getDate() - dias));
  return [
    { rotulo: 'Últimos 7 dias', inicio: menos(6), fim: hoje.value },
    { rotulo: 'Últimos 30 dias', inicio: menos(29), fim: hoje.value },
    { rotulo: 'Este mês', inicio: `${hoje.value.slice(0, 7)}-01`, fim: hoje.value },
    { rotulo: 'Este ano', inicio: `${hoje.value.slice(0, 4)}-01-01`, fim: hoje.value },
  ];
});

const foco = computed(
  () => (etapa.value === 'fim' ? fim.value || inicio.value : inicio.value) || (props.unico && props.minimo) || hoje.value,
);
const ano = computed(() => Number(foco.value.slice(0, 4)));
const mes = computed(() => Number(foco.value.slice(5, 7)) - 1);

const destaque = computed(() => {
  if (props.unico) return inicio.value ? paraData(inicio.value) : undefined;
  if (!inicio.value) return [];
  if (!fim.value) return [paraData(inicio.value)];
  const dias = [];
  for (let d = paraData(inicio.value); d <= paraData(fim.value); d.setDate(d.getDate() + 1)) dias.push(new Date(d));
  return dias;
});

const dica = computed(() => {
  if (etapa.value === 'inicio') return 'Passo 1 de 2 · toque no dia em que o período começa.';
  if (!fim.value) return 'Passo 2 de 2 · agora toque no dia em que ele termina (pode ser o mesmo dia).';
  return 'Pronto. Confira as datas e toque em "Aplicar período".';
});

const rotulo = computed(() => {
  const [i, f] = periodo.value;
  if (!i) return props.rotuloVazio;
  return props.unico || i === f ? formatData(i) : `${formatData(i)} – ${formatData(f)}`;
});

watch(aberto, (visivel) => {
  if (!visivel) return;
  [inicio.value = '', fim.value = ''] = periodo.value;
  etapa.value = inicio.value && !fim.value ? 'fim' : 'inicio';
});

function selecionar(dias) {
  if (props.unico) {
    if (dias) inicio.value = paraIso(dias);
    return;
  }
  const escolhidos = (dias ?? []).map(paraIso).sort();
  let clicado = escolhidos.length > 1 && escolhidos[0] === inicio.value ? escolhidos.at(-1) : escolhidos[0];
  clicado ??= inicio.value;
  if (!clicado) return;

  if (etapa.value === 'inicio' || clicado < inicio.value) {
    inicio.value = clicado;
    fim.value = '';
    etapa.value = 'fim';
    return;
  }
  fim.value = clicado;
}

function usarAtalho(a) {
  inicio.value = a.inicio;
  fim.value = a.fim;
  etapa.value = 'fim';
}

function confirmar() {
  periodo.value = props.unico ? [inicio.value] : [inicio.value, fim.value];
  aberto.value = false;
}

function limpar() {
  inicio.value = '';
  fim.value = '';
  etapa.value = 'inicio';
  periodo.value = [];
  aberto.value = false;
}
</script>

<style scoped>
.dote-etapas {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}
.dote-etapas--unica {
  grid-template-columns: 1fr;
}
.dote-etapa {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-bright));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  text-align: left;
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;
}
.dote-etapa:disabled {
  opacity: 0.5;
}
.dote-etapa--atual {
  border-color: rgb(var(--v-theme-neon-600));
  background: rgb(var(--v-theme-neon-950));
  box-shadow: 0 0 12px rgba(var(--v-theme-primary), 0.18);
}
.dote-etapa-numero {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-muted));
  font-size: 13px;
}
.dote-etapa--atual .dote-etapa-numero {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.dote-dica {
  margin: 12px 0 4px;
  font-size: 14px;
  color: rgb(var(--v-theme-neon-300));
}
.dote-calendario {
  max-width: 420px;
  margin-inline: auto;
}
@media (max-width: 420px) {
  .dote-etapas {
    grid-template-columns: 1fr;
  }
  .dote-etapas > .v-icon {
    display: none;
  }
}
</style>
