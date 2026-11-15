<template>
  <div>
    <AbasSecao :abas="ABAS_TRANSFERENCIAS" />
    <div class="dote-transferencia-conteudo">
      <v-card class="pa-6 dote-transferencia-enviar">
        <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-6">
          <h2 class="dote-subtitulo">{{ destino ? 'Quanto você quer enviar?' : 'Para quem você quer enviar?' }}</h2>
          <span class="text-muted text-body-2"
            >Saldo <span class="dote-num text-on-surface">{{ conta.resumo ? formatMoney(conta.resumo.saldoCentavos) : '—' }}</span></span
          >
        </div>

        <AlertaErro :mensagem="erro || erroContato" class="mb-4" />

        <v-form v-if="!destino" @submit.prevent="consultar">
          <v-text-field
            v-model="chave"
            label="Chave de transferência do destinatário"
            placeholder="e-mail, CPF, celular ou chave aleatória"
            prepend-inner-icon="mdi-key-outline"
            class="mb-2"
            :autofocus="!route.hash"
          />
          <v-btn
            type="submit"
            color="primary"
            class="dote-cta"
            block
            size="large"
            :loading="carregando"
            :disabled="!chave.trim()"
            >Continuar</v-btn
          >
        </v-form>

        <v-form v-else @submit.prevent="enviar">
          <v-card color="surface-bright" class="pa-4 mb-6">
            <div class="dote-label mb-1">você vai enviar para</div>
            <div class="text-h6 font-weight-regular">{{ destino.nome }}</div>
            <div class="text-muted text-body-2">CPF {{ destino.cpf }} · {{ destino.banco }}</div>
            <div class="text-muted text-body-2 dote-mono">{{ tiposChave[destino.tipoChave] }}: {{ destino.chave }}</div>
          </v-card>
          <CampoValor v-model="valorCentavos" autofocus />
          <v-select v-model="categoria" :items="CATEGORIAS" label="Categoria">
            <template #item="{ props: item, item: { raw } }">
              <v-list-item v-bind="item" :prepend-icon="ICONES_CATEGORIAS[raw]" />
            </template>
            <template #selection="{ item }">
              <v-icon :icon="ICONES_CATEGORIAS[item.raw]" size="18" class="mr-2" color="neon-600" />{{ item.raw }}
            </template>
          </v-select>
          <v-text-field v-model="descricao" label="Mensagem (opcional)" counter="140" maxlength="140" />
          <v-btn
            type="submit"
            color="primary"
            class="dote-cta mt-2"
            block
            size="large"
            :loading="carregando"
            :disabled="!valorCentavos"
          >
            Enviar {{ valorCentavos ? formatMoney(valorCentavos) : '' }}
          </v-btn>
          <v-btn variant="text" color="muted" block class="mt-2" @click="voltar">Trocar destinatário</v-btn>
        </v-form>

        <div class="text-body-2 text-muted mt-6">
          Para receber, cadastre suas <router-link to="/transferencias/chaves" class="text-neon-600">chaves de transferência</router-link>.
        </div>
      </v-card>

      <div class="dote-transferencia-lateral">
        <v-card class="pa-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
            <h2 class="dote-subtitulo">Contatos</h2>
            <router-link to="/transferencias/contatos" class="text-neon-600 text-body-2">Gerenciar</router-link>
          </div>
          <div v-if="contatos.length" class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="c in contatos"
              :key="c.id"
              color="neon-950"
              prepend-icon="mdi-account-outline"
              :disabled="carregando"
              @click="consultarContato(c)"
              >{{ c.apelido }}</v-chip
            >
          </div>
          <p v-else class="text-muted text-body-2 ma-0">Seus contatos salvos aparecem aqui.</p>

          <v-form v-if="destino && !jaEContato" class="dote-salvar-contato mt-5" @submit.prevent="salvarContato">
            <div class="dote-label">salvar {{ destino.nome.split(' ')[0] }} como contato</div>
            <div class="dote-salvar-linha">
              <v-text-field
                v-model="apelido"
                placeholder="apelido"
                maxlength="40"
                hide-details
                density="compact"
                aria-label="Apelido do contato"
              />
              <v-btn type="submit" color="neon-950" height="40" :loading="salvando" :disabled="!apelido.trim()"
                >Salvar</v-btn
              >
            </div>
          </v-form>
        </v-card>

        <section id="agendados" ref="agendados" aria-label="Transferências agendadas">
          <AgendamentosTransferencias />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AlertaErro from '../components/AlertaErro.vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contatosApi } from '../api/contatos';
import AbasSecao from '../components/AbasSecao.vue';
import CampoValor from '../components/CampoValor.vue';
import AgendamentosTransferencias from '../components/AgendamentosTransferencias.vue';
import { aoAbrirTela } from '../composables/aoAbrirTela';
import { useAcao } from '../composables/useAcao';
import { transferenciasApi } from '../api/transferencias';
import { useContaStore } from '../stores/conta';
import { CATEGORIAS, ICONES_CATEGORIAS, TIPOS_CHAVE as tiposChave } from '../utils/constantes';
import { formatMoney } from '../utils/formatMoney';
import { ABAS_TRANSFERENCIAS } from '../utils/secoes';

const router = useRouter();
const route = useRoute();
const conta = useContaStore();
const chaveDaRota = route.query.chave;
const chave = ref(typeof chaveDaRota === 'string' ? chaveDaRota : '');
const agendados = ref(null);
watch(
  [agendados, () => route.hash],
  ([secao, hash]) => {
    if (secao && hash === '#agendados') secao.scrollIntoView();
  },
  { flush: 'post' },
);
const contatos = ref([]);
const apelido = ref('');
const destino = ref(null);
const valorCentavos = ref(null);
const categoria = ref('Outros');
const descricao = ref('');
const { carregando, erro, executar } = useAcao();
const { carregando: salvando, erro: erroContato, executar: executarContato } = useAcao();

const jaEContato = computed(() => contatos.value.some((c) => c.chave === destino.value?.chave));

const carregarContatos = async () => {
  try {
    contatos.value = (await contatosApi.listar()).itens;
  } catch {
    contatos.value = [];
  }
};
aoAbrirTela(carregarContatos);

async function salvarContato() {
  const c = await executarContato(() =>
    contatosApi.criar({ apelido: apelido.value.trim(), chave: destino.value.chave }),
  );
  if (!c) return;
  apelido.value = '';
  carregarContatos();
}

async function consultar() {
  const d = await executar(() => transferenciasApi.consultarDestinatario(chave.value));
  if (d?.propria) erro.value = 'Essa chave é sua. Escolha a de outra pessoa.';
  else if (d) destino.value = d;
}

function consultarContato(contato) {
  chave.value = contato.chave;
  return consultar();
}

function voltar() {
  destino.value = null;
  erro.value = '';
}

async function enviar() {
  const t = await executar(() =>
    transferenciasApi.enviar({
      chave: destino.value.chave,
      valorCentavos: valorCentavos.value,
      categoria: categoria.value,
      descricao: descricao.value,
    }),
  );
  if (t) router.push(`/comprovante/${t.id}`);
}
</script>

<style scoped>
.dote-transferencia-conteudo {
  display: grid;
  align-items: start;
  gap: 24px;
}
.dote-transferencia-lateral {
  display: grid;
  gap: 24px;
}
#agendados {
  scroll-margin-top: 84px;
}
@media (min-width: 960px) {
  .dote-transferencia-conteudo {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 28px;
  }
}
.dote-salvar-contato {
  display: grid;
  gap: 8px;
}
.dote-salvar-linha {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}
</style>
