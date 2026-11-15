<template>
  <div>
    <v-btn variant="text" color="neon-600" prepend-icon="mdi-chevron-left" to="/pix" class="mb-3">
      Voltar ao envio
    </v-btn>
    <v-card class="pa-5 mb-4">
      <p class="text-muted text-body-2 mt-0 mb-4">Salve quem você paga com frequência. Até 50 contatos.</p>
      <v-btn
        color="primary"
        class="dote-cta"
        prepend-icon="mdi-plus"
        :disabled="contatos.length >= 50"
        @click="abrirNovo"
        >Novo contato</v-btn
      >
    </v-card>

    <AlertaErro :mensagem="erro" class="mb-4" />

    <v-card>
      <v-skeleton-loader v-if="!pronto" type="list-item-two-line@3" color="surface" />
      <v-list v-else bg-color="surface" class="py-0">
        <v-list-item v-for="c in contatos" :key="c.id" class="py-3 dote-linha">
          <template #prepend>
            <v-avatar color="neon-950" rounded="sm" size="40" class="mr-3"
              ><v-icon icon="mdi-account-outline" color="neon-300" size="20"
            /></v-avatar>
          </template>
          <v-list-item-title>{{ c.apelido }}</v-list-item-title>
          <v-list-item-subtitle class="dote-mono">{{ c.destinatario }} · {{ c.chave }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-send-outline"
              variant="text"
              size="small"
              color="neon-600"
              :aria-label="`Transferir para ${c.apelido}`"
              :to="{ path: '/pix', query: { chave: c.chave } }"
            />
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              color="neon-600"
              :aria-label="`Editar ${c.apelido}`"
              @click="abrirEdicao(c)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              :aria-label="`Excluir ${c.apelido}`"
              @click="aExcluir = c"
            />
          </template>
        </v-list-item>
        <p v-if="!contatos.length" class="text-muted pa-6 ma-0">Nenhum contato ainda.</p>
      </v-list>
    </v-card>

    <v-dialog v-model="form.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">{{ form.id ? 'Editar contato' : 'Novo contato' }}</h3>
        <AlertaErro :mensagem="erroForm" class="mb-4" />
        <v-form @submit.prevent="salvarContato">
          <v-text-field v-model="form.apelido" label="Apelido" maxlength="40" :rules="[obrigatorio]" />
          <v-text-field
            v-model="form.chave"
            label="Chave de transferência"
            placeholder="e-mail, CPF, celular ou chave aleatória"
            :rules="[obrigatorio]"
            class="mb-4"
          />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="form.aberto = false">Cancelar</v-btn>
            <v-btn
              type="submit"
              color="neon-950"
              :loading="salvando"
              :disabled="!form.apelido.trim() || !form.chave.trim()"
              >Salvar</v-btn
            >
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <DialogoConfirmar
      :model-value="!!aExcluir"
      titulo="Excluir contato?"
      :mensagem="aExcluir ? `${aExcluir.apelido} sai da sua lista. As transferências já enviadas continuam no extrato.` : ''"
      acao="Excluir"
      perigo
      :carregando="carregando"
      @update:model-value="aExcluir = null"
      @confirmar="excluirContato"
    />
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { reactive, ref } from 'vue';
import { contatosApi } from '../api/contatos';
import DialogoConfirmar from '../components/DialogoConfirmar.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { obrigatorio } from '../utils/regrasForm';

const contatos = ref([]);
const aExcluir = ref(null);
const form = reactive({ aberto: false, id: null, apelido: '', chave: '' });
const { carregando, erro, executar } = useAcao();
const { carregando: salvando, erro: erroForm, executar: executarForm } = useAcao();

async function carregarContatos() {
  await executar(async () => {
    const lista = await contatosApi.listar();
    contatos.value = lista.itens;
  });
}

function abrirNovo() {
  erroForm.value = '';
  Object.assign(form, { aberto: true, id: null, apelido: '', chave: '' });
}

function abrirEdicao(c) {
  erroForm.value = '';
  Object.assign(form, { aberto: true, id: c.id, apelido: c.apelido, chave: c.chave });
}

async function salvarContato(evento) {
  const { valid } = await evento;
  if (!valid) return;

  const { id, apelido, chave } = form;
  const dados = { apelido: apelido.trim(), chave: chave.trim() };
  const contatoSalvo = await executarForm(async () => {
    if (id) return contatosApi.atualizar(id, dados);
    return contatosApi.criar(dados);
  });
  if (!contatoSalvo) return;

  form.aberto = false;
  await carregarContatos();
}

async function excluirContato() {
  const { id } = aExcluir.value;
  const excluido = await executar(async () => {
    await contatosApi.excluir(id);
    return true;
  });
  aExcluir.value = null;
  if (excluido) await carregarContatos();
}

const pronto = aoAbrirTela(carregarContatos);
</script>

<style scoped>
.dote-linha + .dote-linha {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
</style>
