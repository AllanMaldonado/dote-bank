<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-4 mb-4 text-body-2">
      <span class="d-flex align-center ga-2"><span class="dote-chave dote-chave--entrada" />Entradas</span>
      <span class="d-flex align-center ga-2"><span class="dote-chave dote-chave--saida" />Saídas</span>
      <v-spacer />
      <v-btn variant="text" size="small" color="neon-600" @click="tabela = !tabela">
        {{ tabela ? 'ver gráfico' : 'ver tabela' }}
      </v-btn>
    </div>

    <div v-if="!tabela" class="dote-grafico" role="img" :aria-label="descricao">
      <div class="dote-eixo-y text-muted">
        <span v-for="g in grade" :key="g.valor" :style="{ top: `${g.y}%` }">{{
          g.valor ? formatCompacto(g.valor) : '0'
        }}</span>
      </div>

      <div class="dote-plota">
        <div v-for="g in grade" :key="g.valor" class="dote-grade" :style="{ top: `${g.y}%` }" />

        <svg class="dote-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient :id="`${id}-e`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" class="dote-stop dote-stop--entrada" stop-opacity="0.35" />
              <stop offset="1" class="dote-stop dote-stop--entrada" stop-opacity="0" />
            </linearGradient>
            <linearGradient :id="`${id}-s`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" class="dote-stop dote-stop--saida" stop-opacity="0.28" />
              <stop offset="1" class="dote-stop dote-stop--saida" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="area(pontosSaida)" :fill="`url(#${id}-s)`" />
          <path :d="area(pontosEntrada)" :fill="`url(#${id}-e)`" />
          <path :d="linha(pontosSaida)" class="dote-linha-grafico dote-linha-grafico--saida" />
          <path :d="linha(pontosEntrada)" class="dote-linha-grafico dote-linha-grafico--entrada" />
        </svg>

        <template v-for="(m, i) in meses" :key="`p${m.mes}`">
          <span
            class="dote-ponto dote-ponto--entrada"
            :class="{ 'dote-ponto--ativo': ativo === m.mes }"
            :style="posicao(pontosEntrada[i])"
          />
          <span
            class="dote-ponto dote-ponto--saida"
            :class="{ 'dote-ponto--ativo': ativo === m.mes }"
            :style="posicao(pontosSaida[i])"
          />
        </template>

        <button
          v-for="(m, i) in meses"
          :key="m.mes"
          type="button"
          class="dote-hit"
          :class="{ 'dote-hit--ativo': ativo === m.mes }"
          :style="{ left: `${(i / meses.length) * 100}%`, width: `${100 / meses.length}%` }"
          :aria-label="`${formatMes(m.mes)}: entrou ${formatMoney(m.entradasCentavos)}, saiu ${formatMoney(m.saidasCentavos)}`"
          @pointerenter="ativo = m.mes"
          @pointerleave="ativo = null"
          @focus="ativo = m.mes"
          @blur="ativo = null"
        >
          <span v-if="ativo === m.mes" class="dote-dica" :class="ladoDaDica(i)" role="tooltip">
            <strong class="d-block mb-1">{{ formatMes(m.mes) }}</strong>
            <span class="dote-linha-dica"
              ><span class="dote-traco dote-traco--entrada" />{{ formatMoney(m.entradasCentavos) }}
              <span class="text-muted">entradas</span></span
            >
            <span class="dote-linha-dica"
              ><span class="dote-traco dote-traco--saida" />{{ formatMoney(m.saidasCentavos) }}
              <span class="text-muted">saídas</span></span
            >
            <span v-if="m.rendimentosCentavos" class="dote-linha-dica text-muted"
              >+ {{ formatMoney(m.rendimentosCentavos) }} rendimentos</span
            >
          </span>
        </button>
      </div>

      <div class="dote-eixo-x text-muted">
        <span v-for="(m, i) in meses" :key="m.mes" :style="{ width: `${100 / meses.length}%` }">{{
          rotulo(m.mes, i)
        }}</span>
      </div>
    </div>

    <v-table v-else density="compact" class="dote-tabela-meses">
      <thead>
        <tr>
          <th class="dote-label">mês</th>
          <th class="dote-label text-right"><span class="dote-chave dote-chave--entrada mr-2" />entradas</th>
          <th class="dote-label text-right"><span class="dote-chave dote-chave--saida mr-2" />saídas</th>
          <th class="dote-label text-right"><span class="dote-chave dote-chave--rendimento mr-2" />rendimentos</th>
          <th class="dote-label text-right">resultado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in meses" :key="m.mes">
          <td>{{ formatMes(m.mes) }}</td>
          <td class="text-right dote-num text-success">{{ formatMoney(m.entradasCentavos, { sinal: true }) }}</td>
          <td class="text-right dote-num text-error">{{ formatMoney(-m.saidasCentavos) }}</td>
          <td class="text-right dote-num text-neon-300">{{ formatMoney(m.rendimentosCentavos, { sinal: true }) }}</td>
          <td class="text-right dote-num" :class="resultado(m) < 0 ? 'text-error' : 'text-on-surface'">
            {{ formatMoney(resultado(m), { sinal: true }) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td class="dote-label">total</td>
          <td class="text-right dote-num text-success">{{ formatMoney(total.entradas, { sinal: true }) }}</td>
          <td class="text-right dote-num text-error">{{ formatMoney(-total.saidas) }}</td>
          <td class="text-right dote-num text-neon-300">{{ formatMoney(total.rendimentos, { sinal: true }) }}</td>
          <td class="text-right dote-num" :class="total.resultado < 0 ? 'text-error' : 'text-on-surface'">
            {{ formatMoney(total.resultado, { sinal: true }) }}
          </td>
        </tr>
      </tfoot>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatMes, formatMesCurto } from '../utils/datas';
import { formatMoney, SIMBOLO_PONTOS } from '../utils/formatMoney';

type Mes = { mes: string; entradasCentavos: number; saidasCentavos: number; rendimentosCentavos: number };
const props = defineProps<{ meses: Mes[] }>();

const id = `dote-graf-${Math.random().toString(36).slice(2, 9)}`;

const tabela = ref(false);
const resultado = (m) => m.entradasCentavos + m.rendimentosCentavos - m.saidasCentavos;
const total = computed(() =>
  props.meses.reduce(
    (s, m) => ({
      entradas: s.entradas + m.entradasCentavos,
      saidas: s.saidas + m.saidasCentavos,
      rendimentos: s.rendimentos + m.rendimentosCentavos,
      resultado: s.resultado + resultado(m),
    }),
    { entradas: 0, saidas: 0, rendimentos: 0, resultado: 0 },
  ),
);
const ativo = ref(null);

const n = computed(() => props.meses.length);
const maximo = computed(() => Math.max(1, ...props.meses.flatMap((m) => [m.entradasCentavos, m.saidasCentavos])));

const Y = (valor) => 100 - (valor / maximo.value) * 90;
const X = (i) => ((i + 0.5) / n.value) * 100;
const pontos = (campo) => props.meses.map((m, i) => ({ x: X(i), y: Y(m[campo]) }));
const pontosEntrada = computed(() => pontos('entradasCentavos'));
const pontosSaida = computed(() => pontos('saidasCentavos'));

const grade = computed(() =>
  [1, 2 / 3, 1 / 3, 0].map((f) => ({ valor: Math.round(maximo.value * f), y: Y(maximo.value * f) })),
);

function linha(p) {
  if (!p.length) return '';
  if (p.length === 1) return `M0 ${p[0].y} L100 ${p[0].y}`;
  const dx = p.map((_, i) => (i < p.length - 1 ? p[i + 1].x - p[i].x : 0));
  const s = dx.slice(0, -1).map((d, i) => (p[i + 1].y - p[i].y) / d);
  const m = p.map((_, i) =>
    i === 0 ? s[0] : i === p.length - 1 ? s[s.length - 1] : s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2,
  );
  for (let i = 0; i < s.length; i++) {
    if (s[i] === 0) m[i] = m[i + 1] = 0;
    else {
      const a = m[i] / s[i];
      const b = m[i + 1] / s[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        m[i] = (3 * a * s[i]) / h;
        m[i + 1] = (3 * b * s[i]) / h;
      }
    }
  }
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const t = dx[i] / 3;
    d += ` C${p[i].x + t} ${p[i].y + m[i] * t} ${p[i + 1].x - t} ${p[i + 1].y - m[i + 1] * t} ${p[i + 1].x} ${p[i + 1].y}`;
  }
  return d;
}
const area = (p) => (p.length > 1 ? `${linha(p)} L${p[p.length - 1].x} 100 L${p[0].x} 100 Z` : '');

const posicao = (p) => ({ left: `${p.x}%`, top: `${p.y}%` });

const rotulo = (mes, i) => (props.meses.length > 12 && i % 3 ? '' : formatMesCurto(mes));

const ladoDaDica = (i) => (i < 2 ? 'dote-dica--esquerda' : i > props.meses.length - 3 ? 'dote-dica--direita' : '');

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const formatCompacto = (centavos) => `${SIMBOLO_PONTOS} ${compacto.format(centavos / 100)}`;

const descricao = computed(
  () =>
    `Entradas e saídas por mês: ${props.meses.map((m) => `${formatMes(m.mes)} entrou ${formatMoney(m.entradasCentavos)} e saiu ${formatMoney(m.saidasCentavos)}`).join('; ')}`,
);
</script>

<style scoped>
.dote-grafico {
  display: grid;
  grid-template-columns: 52px 1fr;
  grid-template-rows: 240px auto;
  column-gap: 8px;
}
.dote-eixo-y {
  position: relative;
  font-size: 11px;
}
.dote-eixo-y span {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  white-space: nowrap;
}
.dote-plota {
  position: relative;
}
.dote-grade {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed rgb(var(--v-theme-outline));
}
.dote-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  animation: dote-aparecer 0.5s ease-out both;
}
@keyframes dote-aparecer {
  from {
    opacity: 0;
  }
}
.dote-stop--entrada {
  stop-color: rgb(var(--v-theme-neon-600));
}
.dote-stop--saida {
  stop-color: rgb(var(--v-theme-error));
}
.dote-linha-grafico {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.dote-linha-grafico--entrada {
  stroke: rgb(var(--v-theme-neon-600));
}
.dote-linha-grafico--saida {
  stroke: rgb(var(--v-theme-error));
}
.dote-ponto {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: rgb(var(--v-theme-surface));
  pointer-events: none;
  transition:
    width 0.12s,
    height 0.12s;
}
.dote-ponto--entrada {
  box-shadow: 0 0 0 1.5px rgb(var(--v-theme-neon-600));
}
.dote-ponto--saida {
  box-shadow: 0 0 0 1.5px rgb(var(--v-theme-error));
}
.dote-ponto--ativo {
  width: 10px;
  height: 10px;
}
.dote-ponto--entrada.dote-ponto--ativo {
  background: rgb(var(--v-theme-neon-600));
}
.dote-ponto--saida.dote-ponto--ativo {
  background: rgb(var(--v-theme-error));
}
.dote-hit {
  position: absolute;
  top: 0;
  bottom: 0;
  background: none;
  border: 0;
  padding: 0;
  cursor: default;
}
.dote-hit--ativo,
.dote-hit:focus-visible {
  background: linear-gradient(to bottom, transparent, rgba(var(--v-theme-on-surface), 0.06));
  outline: none;
}
.dote-eixo-x {
  grid-column: 2;
  display: flex;
  margin-top: 8px;
  font-size: 11px;
}
.dote-eixo-x span {
  text-align: center;
  white-space: nowrap;
}
.dote-chave {
  display: inline-block;
  vertical-align: middle;
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
.dote-chave--rendimento {
  background: rgb(var(--v-theme-neon-300));
}
.dote-tabela-meses tfoot td {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
.dote-chave--entrada,
.dote-traco--entrada {
  background: rgb(var(--v-theme-neon-600));
}
.dote-chave--saida,
.dote-traco--saida {
  background: rgb(var(--v-theme-error));
}
.dote-dica {
  position: absolute;
  z-index: 2;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 190px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-bright));
  box-shadow:
    0 0 0 1px rgb(var(--v-theme-outline)),
    0 8px 24px rgba(var(--v-theme-background), 0.6);
  text-align: left;
  font-size: 12px;
  pointer-events: none;
}
.dote-dica--esquerda {
  left: 0;
  transform: none;
}
.dote-dica--direita {
  left: auto;
  right: 0;
  transform: none;
}
.dote-dica strong {
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
}
.dote-linha-dica {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.dote-traco {
  width: 10px;
  height: 3px;
  border-radius: 2px;
}
@media (max-width: 480px) {
  .dote-grafico {
    grid-template-columns: 44px 1fr;
    grid-template-rows: 200px auto;
  }
}
</style>
