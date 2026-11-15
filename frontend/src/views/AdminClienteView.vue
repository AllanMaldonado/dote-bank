<template>
  <div>
    <v-btn variant="text" color="neon-600" prepend-icon="mdi-arrow-left" to="/admin" class="mb-2">Clientes</v-btn>
    <AlertaErro :mensagem="erro" class="mb-4" />

    <v-card v-if="cliente" class="pa-5 mb-6">
      <div class="d-flex flex-wrap align-center ga-3">
        <div>
          <h1 class="dote-title">&gt; {{ cliente.nome }}</h1>
          <div class="text-muted text-body-2">
            {{ cliente.email }} · CPF {{ cpf }} · {{ cliente.celular || 'sem celular' }}
          </div>
        </div>
        <v-chip color="surface-bright" :class="STATUS_CONTA[cliente.status].classe">{{
          STATUS_CONTA[cliente.status].rotulo
        }}</v-chip>
        <v-spacer />
        <div class="text-right">
          <div class="dote-label">saldo em conta</div>
          <div class="dote-valor-grande dote-num">{{ formatMoney(cliente.saldoCentavos ?? 0) }}</div>
        </div>
      </div>
      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn color="neon-950" prepend-icon="mdi-pencil-outline" @click="abrirEdicao">Editar dados</v-btn>
        <v-btn v-if="cliente.status === 'pendente'" color="neon-950" @click="acao('aprovar')">Aprovar</v-btn>
        <v-btn v-if="cliente.status === 'pendente'" variant="text" color="error" @click="acao('rejeitar')"
          >Rejeitar</v-btn
        >
        <v-btn
          v-if="cliente.status === 'ativo'"
          variant="text"
          color="error"
          prepend-icon="mdi-lock-outline"
          @click="acao('bloquear')"
          >Bloquear</v-btn
        >
        <v-btn
          v-if="cliente.status === 'bloqueado'"
          color="neon-950"
          prepend-icon="mdi-lock-open-outline"
          @click="acao('desbloquear')"
          >Desbloquear</v-btn
        >
        <v-btn
          v-if="['pendente', 'rejeitado'].includes(cliente.status)"
          variant="text"
          color="error"
          prepend-icon="mdi-delete-outline"
          @click="confirmarExclusao = true"
          >Excluir</v-btn
        >
      </div>
    </v-card>

    <template v-if="cliente && cliente.status !== 'pendente'">
      <h2 class="dote-title mb-3">&gt; relatório do cliente</h2>
      <RelatorioPainel :cliente-id="id" />
    </template>

    <v-dialog v-model="edicao.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">Editar dados</h3>
        <v-form @submit.prevent="salvar">
          <v-text-field v-model="edicao.nome" label="Nome" />
          <v-text-field v-model="edicao.email" label="E-mail" type="email" />
          <v-text-field v-model="edicao.celular" label="Celular" inputmode="tel" />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="edicao.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="carregando">Salvar</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <DialogoConfirmar
      v-model="confirmarExclusao"
      titulo="Excluir cadastro?"
      mensagem="Só cadastros que nunca operaram podem ser excluídos. Não dá para desfazer."
      acao="Excluir"
      perigo
      :carregando="carregando"
      @confirmar="excluir"
    />
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DialogoConfirmar from '../components/DialogoConfirmar.vue';
import RelatorioPainel from '../components/RelatorioPainel.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { adminApi } from '../api/admin';
import { useToastStore } from '../stores/toast';
import { STATUS_CONTA } from '../utils/constantes';
import { formatMoney } from '../utils/formatMoney';

const route = useRoute();
const router = useRouter();
const id = String(route.params.id);
const cliente = ref(null);
const confirmarExclusao = ref(false);
const edicao = reactive({ aberto: false, nome: '', email: '', celular: '' });
const toast = useToastStore();
const { carregando, erro, executar } = useAcao();
const cpf = computed(() => (cliente.value?.cpf ?? '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));

const carregar = () => executar(async () => (cliente.value = await adminApi.obterCliente(id)));

function abrirEdicao() {
  Object.assign(edicao, {
    aberto: true,
    nome: cliente.value.nome,
    email: cliente.value.email,
    celular: cliente.value.celular ?? '',
  });
}

async function salvar() {
  const u = await executar(() =>
    adminApi.atualizarCliente(id, { nome: edicao.nome, email: edicao.email, celular: edicao.celular || undefined }),
  );
  if (!u) return;
  cliente.value = u;
  edicao.aberto = false;
  toast.mostrar('Dados atualizados');
}

async function acao(nome) {
  const u = await executar(() => adminApi.mudarStatus(id, nome));
  if (u) {
    cliente.value = u;
    toast.mostrar(`Status do cliente: ${u.status}`);
  }
}

async function excluir() {
  const ok = await executar(() => adminApi.excluirCliente(id));
  confirmarExclusao.value = false;
  if (ok === undefined) return;
  toast.mostrar('Cadastro excluído');
  router.push('/admin');
}

aoAbrirTela(carregar);
</script>
