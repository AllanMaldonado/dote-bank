<template>
  <v-btn color="primary" class="dote-cta" prepend-icon="mdi-download-outline" :disabled="desabilitado" @click="abrir">
    Exportar
  </v-btn>
  <v-dialog v-model="aberto" max-width="640">
    <v-card class="dote-exportar">
      <div class="dote-exportar-topo">
        <span class="dote-exportar-icone"><v-icon icon="mdi-download-outline" size="22" /></span>
        <div class="flex-grow-1">
          <h2 class="dote-subtitulo">Exportar relatório</h2>
          <p class="text-muted text-body-2 ma-0">Gera o relatório com os filtros aplicados agora.</p>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Fechar" @click="aberto = false" />
      </div>

      <div class="dote-exportar-corpo">
        <div class="d-flex flex-wrap ga-2 mb-5">
          <v-chip color="surface-bright" prepend-icon="mdi-calendar-range">{{ rotuloPeriodo }}</v-chip>
          <v-chip color="surface-bright" :prepend-icon="ICONES_CATEGORIAS[filtros.categoria] ?? 'mdi-tag-multiple-outline'">
            {{ filtros.categoria || 'Todas as categorias' }}
          </v-chip>
        </div>

        <AlertaErro :mensagem="erro" class="mb-4" />

        <div class="dote-exportar-opcoes" role="list">
          <button
            v-for="o in OPCOES"
            :key="o.titulo"
            type="button"
            role="listitem"
            class="dote-exportar-opcao"
            :disabled="carregando"
            @click="exportar(o.acao)"
          >
            <v-icon :icon="o.icone" size="28" color="neon-300" />
            <span class="text-body-1">{{ o.titulo }}</span>
            <span class="text-muted text-body-2">{{ o.texto }}</span>
          </button>
        </div>
      </div>
      <v-progress-linear v-if="carregando" indeterminate color="primary" />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import AlertaErro from './AlertaErro.vue';
import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';
import fonte from '@fontsource/share-tech-mono/files/share-tech-mono-latin-400-normal.woff2?inline';
import css from '../styles/relatorioExportacao.css?raw';
import { useAcao } from '../composables/useAcao';
import { useToastStore } from '../stores/toast';
import { ICONES_CATEGORIAS } from '../utils/constantes';
import { formatData } from '../utils/datas';
import { gerarHtml, gerarMarkdown, nomeDoRelatorio } from '../utils/relatorioExportacao';

const props = defineProps({
  obter: { type: Function, required: true },
  desabilitado: Boolean,
  filtros: { type: Object, default: () => ({}) },
});

const rotuloPeriodo = computed(() => {
  const { inicio, fim } = props.filtros;
  if (!inicio) return 'Este ano';
  return inicio === fim ? formatData(inicio) : `${formatData(inicio)} – ${formatData(fim)}`;
});

const tema = useTheme();
const toast = useToastStore();
const aberto = ref(false);
const { carregando, erro, executar } = useAcao();

function abrir() {
  erro.value = '';
  aberto.value = true;
}

function baixar(relatorio, conteudo, formato, mime) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nomeDoRelatorio(relatorio)}.${formato}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const html = (r) => gerarHtml(r, null, { cores: tema.themes.value.doteClaro.colors, css, fonte });
const baixarMd = (r) => baixar(r, gerarMarkdown(r, null), 'md', 'text/markdown');
const baixarHtml = (r) => baixar(r, html(r), 'html', 'text/html');

async function exportar(acao) {
  const janela = acao === imprimir ? window.open('', '_blank') : null;
  const relatorio = await executar(() => props.obter());
  if (!relatorio) {
    janela?.close();
    return;
  }
  aberto.value = false;
  return acao(relatorio, janela);
}

async function imprimir(relatorio, janela) {
  if (!janela) {
    toast.mostrar('Permita abrir uma nova aba para salvar o PDF.', 'warning');
    return;
  }
  janela.opener = null;
  janela.document.write(html(relatorio));
  janela.document.close();
  await janela.document.fonts.ready;
  if (!janela.closed) {
    janela.focus();
    janela.print();
  }
}

const OPCOES = [
  { titulo: 'PDF', texto: 'abre a impressão', icone: 'mdi-file-pdf-box', acao: imprimir },
  { titulo: 'Markdown', texto: 'arquivo .md', icone: 'mdi-language-markdown-outline', acao: baixarMd },
  { titulo: 'HTML', texto: 'página .html', icone: 'mdi-language-html5', acao: baixarHtml },
];
</script>

<style scoped>
.dote-exportar-topo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 12px 14px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.dote-exportar-icone {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgb(var(--v-theme-neon-950));
  color: rgb(var(--v-theme-neon-300));
}
.dote-exportar-corpo {
  padding: 20px;
}
.dote-exportar-opcoes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.dote-exportar-opcao {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  text-align: left;
  transition:
    background-color 240ms var(--dote-curva),
    border-color 240ms var(--dote-curva),
    transform 200ms var(--dote-curva);
}
.dote-exportar-opcao:hover,
.dote-exportar-opcao:focus-visible {
  background: rgb(var(--v-theme-neon-950));
  border-color: rgb(var(--v-theme-neon-800));
  transform: translateY(-2px);
  outline: none;
}
.dote-exportar-opcao:disabled {
  opacity: 0.5;
}
@media (max-width: 520px) {
  .dote-exportar-opcoes {
    grid-template-columns: 1fr;
  }
}
</style>
