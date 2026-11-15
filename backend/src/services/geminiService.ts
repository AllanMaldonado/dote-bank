const env = require('../config/env');

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const TIMEOUT_TOTAL_MS = 25_000;

function motivoDaFalha(erro, signal) {
  if (signal.aborted || ['TimeoutError', 'AbortError'].includes(erro?.name)) return 'tempo_esgotado';
  if ([401, 403].includes(erro?.status)) return 'credencial_recusada';
  if (erro?.status === 429) return 'limite_provedor';
  if (erro?.status === 404) return 'modelo_indisponivel';
  if (erro?.status === 400) return 'requisicao_recusada';
  return 'provedor_indisponivel';
}

async function chamarGemini(mensagens, modelo, signal) {
  const resposta = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.gemini.apiKey}` },
    body: JSON.stringify({ model: modelo, messages: mensagens, max_tokens: 2048, reasoning_effort: 'low' }),
    signal,
  });
  if (!resposta.ok) {
    throw Object.assign(new Error('Falha no Gemini'), { status: resposta.status });
  }
  const json = await resposta.json();
  return json.choices?.[0]?.message?.content;
}

class GeminiService {
  cliente = env.gemini.apiKey ? chamarGemini : null;

  disponivel() {
    return Boolean(this.cliente && env.gemini.modelos.length);
  }

  definirClienteIA(cliente) {
    this.cliente = cliente;
  }

  async gerar(mensagens, tratarTexto) {
    const prazo = Date.now() + TIMEOUT_TOTAL_MS;
    const limitePorModelo = env.gemini.modelos.length > 1 ? 12_000 : TIMEOUT_TOTAL_MS;
    let falha = 'provedor_indisponivel';
    for (const modelo of env.gemini.modelos) {
      const restante = prazo - Date.now();
      if (restante <= 0) break;
      const signal = AbortSignal.timeout(Math.min(limitePorModelo, restante));
      try {
        const texto = tratarTexto(await this.cliente(mensagens, modelo, signal));
        if (texto) return { texto, modelo };
        falha = 'resposta_invalida';
        console.warn('[ia] resposta fora do formato esperado', modelo);
      } catch (erro) {
        falha = motivoDaFalha(erro, signal);
        console.warn('[ia] falha no modelo', modelo, falha, Number.isInteger(erro?.status) ? erro.status : '');
      }
    }
    return { falha };
  }
}

module.exports = new GeminiService();
