const env = require('../config/env');

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const TIMEOUT_MS = 12_000;

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
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    for (const modelo of env.gemini.modelos) {
      if (signal.aborted) break;
      try {
        const texto = tratarTexto(await this.cliente(mensagens, modelo, signal));
        if (texto) return { texto, modelo };
        console.warn('[ia] resposta fora do formato esperado', modelo);
      } catch (erro) {
        console.warn('[ia] falha no modelo', modelo, Number.isInteger(erro?.status) ? erro.status : '');
      }
    }
    return null;
  }
}

module.exports = new GeminiService();
