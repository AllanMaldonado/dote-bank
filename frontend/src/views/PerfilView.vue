<template>
  <div class="dote-perfil">
    <AlertaErro :mensagem="erro" class="mb-4" />

    <div class="dote-perfil-painel">
      <v-card class="pa-5">
        <div class="dote-identidade">
          <div class="dote-avatar-grande">{{ iniciais }}</div>
          <div class="dote-identidade-texto">
            <div class="text-h6">{{ auth.user?.nome }}</div>
            <div class="text-muted text-body-2">{{ auth.user?.email }}</div>
          </div>
        </div>
        <v-divider class="my-4" />
        <div class="dote-label mb-3">dados da conta</div>
        <div class="dote-dados">
          <div><span class="text-muted">Banco</span><span>DOTE</span></div>
          <div>
            <span class="text-muted">Agência</span><span class="dote-num">{{ auth.user?.agencia }}</span>
          </div>
          <div>
            <span class="text-muted">Conta</span><span class="dote-num">{{ auth.user?.conta }}</span>
          </div>
          <div>
            <span class="text-muted">CPF</span><span class="dote-num">{{ cpf }}</span>
          </div>
        </div>
        <v-btn color="neon-950" block class="mt-4" prepend-icon="mdi-content-copy" @click="copiarDados"
          >Copiar dados da conta</v-btn
        >
      </v-card>

      <v-card>
        <h2 class="dote-subtitulo px-5 pt-5 pb-2">Minha conta</h2>
        <v-list>
          <v-list-item
            prepend-icon="mdi-lock-reset"
            title="Trocar senha"
            append-icon="mdi-chevron-right"
            @click="abrirSenha"
          />
          <v-list-item
            prepend-icon="mdi-account-edit-outline"
            title="Meus dados"
            subtitle="nome e celular"
            append-icon="mdi-chevron-right"
            @click="abrirEdicao"
          />
          <v-divider class="mx-4 my-2" />
          <v-list-item prepend-icon="mdi-logout" title="Sair do app" base-color="error" @click="encerrar" />
        </v-list>
      </v-card>
    </div>

    <v-dialog v-model="senha.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">Trocar senha</h3>
        <AlertaErro :mensagem="erroSenha" class="mb-4" />
        <v-form @submit.prevent="salvarSenha">
          <v-text-field
            v-model="senha.atual"
            label="Senha atual"
            type="password"
            autocomplete="current-password"
            :rules="[obrigatorio]"
          />
          <v-text-field
            v-model="senha.nova"
            label="Nova senha"
            type="password"
            autocomplete="new-password"
            :rules="[regraSenha]"
          />
          <v-text-field
            v-model="senha.confirmacao"
            label="Repita a nova senha"
            type="password"
            autocomplete="new-password"
            :rules="[iguais(() => senha.nova)]"
            class="mb-4"
          />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="senha.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="trocando">Trocar senha</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="edicao.aberto" max-width="560">
      <v-card class="pa-6">
        <h3 class="dote-title mb-4">Meus dados</h3>
        <v-form @submit.prevent="salvar">
          <v-text-field v-model="edicao.nome" label="Nome" :rules="[obrigatorio]" />
          <v-text-field
            v-model="edicao.celular"
            label="Celular"
            inputmode="tel"
            :rules="[celular]"
            hint="trocar o celular remove a chave de transferência antiga desse número"
            persistent-hint
            class="mb-4"
          />
          <v-text-field
            :model-value="auth.user?.email"
            label="E-mail"
            readonly
            hint="para trocar, fale com o banco"
            persistent-hint
            class="mb-4"
          />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" color="muted" @click="edicao.aberto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="carregando">Salvar</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { contaApi } from '../api/conta';
import { useAcao } from '../composables/useAcao';
import { useAuthStore } from '../stores/auth';
import { useContaStore } from '../stores/conta';
import { useToastStore } from '../stores/toast';
import { iniciaisDoNome } from '../utils/iniciais';
import { celular, iguais, obrigatorio, senha as regraSenha } from '../utils/regrasForm';

const router = useRouter();
const auth = useAuthStore();
const conta = useContaStore();
const toast = useToastStore();
const edicao = reactive({ aberto: false, nome: '', celular: '' });
const senha = reactive({ aberto: false, atual: '', nova: '', confirmacao: '' });
const { carregando, erro, executar } = useAcao();
const { carregando: trocando, erro: erroSenha, executar: executarSenha } = useAcao();

const cpf = computed(() => (auth.user?.cpf ?? '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
const iniciais = computed(() => iniciaisDoNome(auth.user?.nome));

function abrirEdicao() {
  Object.assign(edicao, { aberto: true, nome: auth.user?.nome ?? '', celular: auth.user?.celular ?? '' });
}

async function salvar(evento) {
  if (!(await evento).valid) return;
  const r = await executar(() => contaApi.atualizarPerfil({ nome: edicao.nome, celular: edicao.celular || undefined }));
  if (!r) return;
  auth.setUser(r.user);
  edicao.aberto = false;
  toast.mostrar('Dados atualizados.');
}

async function copiarDados() {
  const u = auth.user;
  await navigator.clipboard?.writeText(`DOTE
Agência ${u.agencia}
Conta ${u.conta}
CPF ${cpf.value}
${u.nome}`);
  toast.mostrar('Dados da conta copiados.');
}

function abrirSenha() {
  erroSenha.value = '';
  Object.assign(senha, { aberto: true, atual: '', nova: '', confirmacao: '' });
}

async function salvarSenha(evento) {
  if (!(await evento).valid) return;
  const r = await executarSenha(() => contaApi.trocarSenha({ senhaAtual: senha.atual, novaSenha: senha.nova }));
  if (!r) return;
  auth.setSessao(r.token, r.user);
  senha.aberto = false;
  toast.mostrar('Senha alterada.');
}

async function encerrar() {
  await auth.logout();
  conta.limpar();
  router.push('/login');
}
</script>

<style scoped>
.dote-perfil {
  width: 100%;
  margin-inline: auto;
}
.dote-perfil-painel {
  display: grid;
  align-items: start;
  gap: 16px;
}
.dote-identidade {
  display: flex;
  align-items: center;
  gap: 16px;
}
.dote-identidade-texto {
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (min-width: 960px) {
  .dote-perfil-painel {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
    gap: 24px;
  }
}
.dote-avatar-grande {
  flex: none;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-neon-950));
  color: rgb(var(--v-theme-neon-300));
  font-size: 26px;
  letter-spacing: 0.04em;
}
.dote-dados > div {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}
.dote-dados > div + div {
  border-top: 1px solid rgb(var(--v-theme-outline));
}
</style>
