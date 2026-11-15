<template>
  <div>
    <AbasSecao :abas="ABAS_TRANSFERENCIAS" />
    <v-card class="pa-5 mb-4">
      <p class="text-muted text-body-2 mt-0 mb-4">
        Até 5 chaves. CPF, e-mail e celular são os do seu cadastro; a aleatória é gerada pelo banco.
      </p>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-for="tipo in tiposDisponiveis"
          :key="tipo"
          :color="tipo === 'aleatoria' ? 'primary' : 'neon-950'"
          :class="{ 'dote-cta': tipo === 'aleatoria' }"
          prepend-icon="mdi-plus"
          :disabled="chaves.length >= 5"
          :loading="criando === tipo"
          @click="criar(tipo)"
        >
          {{ TIPOS_CHAVE[tipo] }}
        </v-btn>
      </div>
    </v-card>

    <AlertaErro :mensagem="erro" class="mb-4" />

    <v-card>
      <v-list bg-color="surface" class="py-0">
        <v-list-item v-for="c in chaves" :key="c.id" class="py-3 dote-linha">
          <template #prepend>
            <v-avatar color="neon-950" rounded="sm" size="40" class="mr-3"
              ><v-icon :icon="ICONES[c.tipo]" color="neon-300" size="20"
            /></v-avatar>
          </template>
          <v-list-item-title>{{ TIPOS_CHAVE[c.tipo] }}</v-list-item-title>
          <v-list-item-subtitle class="dote-mono">{{ c.valor }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              color="neon-600"
              :aria-label="`Copiar ${c.valor}`"
              @click="copiar(c.valor)"
            />
            <v-btn
              v-if="c.tipo === 'aleatoria'"
              icon="mdi-refresh"
              variant="text"
              size="small"
              color="neon-600"
              aria-label="Gerar nova chave aleatória"
              @click="regenerar(c)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              aria-label="Excluir chave"
              @click="aExcluir = c"
            />
          </template>
        </v-list-item>
        <p v-if="!chaves.length && !carregando" class="text-muted pa-6 ma-0">
          Você ainda não tem chaves. Sem chave, ninguém consegue te transferir pontos.
        </p>
      </v-list>
    </v-card>

    <DialogoConfirmar
      :model-value="!!aExcluir"
      titulo="Excluir chave?"
      :mensagem="
        aExcluir
          ? `${TIPOS_CHAVE[aExcluir.tipo]}: ${aExcluir.valor}. Quem usar essa chave não vai mais te encontrar.`
          : ''
      "
      acao="Excluir"
      perigo
      :carregando="carregando"
      @update:model-value="aExcluir = null"
      @confirmar="excluir"
    />
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, ref } from 'vue';
import AbasSecao from '../components/AbasSecao.vue';
import DialogoConfirmar from '../components/DialogoConfirmar.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { transferenciasApi } from '../api/transferencias';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import { TIPOS_CHAVE } from '../utils/constantes';
import { ABAS_TRANSFERENCIAS } from '../utils/secoes';

const ICONES = {
  cpf: 'mdi-card-account-details-outline',
  email: 'mdi-email-outline',
  celular: 'mdi-cellphone',
  aleatoria: 'mdi-dice-multiple-outline',
};
const chaves = ref([]);
const criando = ref(null);
const auth = useAuthStore();
const toast = useToastStore();
const aExcluir = ref(null);
const { carregando, erro, executar } = useAcao();

const tiposDisponiveis = computed(() =>
  ['cpf', 'email', 'celular', 'aleatoria'].filter(
    (t) => t === 'aleatoria' || (!chaves.value.some((c) => c.tipo === t) && (t !== 'celular' || auth.user?.celular)),
  ),
);

const carregar = () => executar(async () => (chaves.value = (await transferenciasApi.listarChaves()).itens));

async function criar(tipo) {
  criando.value = tipo;
  const ok = await executar(() => transferenciasApi.criarChave(tipo));
  criando.value = null;
  if (ok) toast.mostrar('Chave criada');
  carregar();
}

async function regenerar(c) {
  const ok = await executar(() => transferenciasApi.regenerarChave(c.id));
  if (ok) toast.mostrar('Chave regenerada');
  carregar();
}

async function excluir() {
  const ok = await executar(() => transferenciasApi.excluirChave(aExcluir.value.id));
  if (ok !== undefined) toast.mostrar('Chave excluída');
  aExcluir.value = null;
  carregar();
}

async function copiar(valor) {
  await navigator.clipboard?.writeText(valor);
  toast.mostrar('Chave copiada');
}

aoAbrirTela(carregar);
</script>

<style scoped>
.dote-linha + .dote-linha {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
</style>
