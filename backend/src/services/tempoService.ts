const { badRequest, conflict } = require('../utils/AppError');
const recorrenciaService = require('./recorrenciaService');
const relogioService = require('./relogioService');
const rendimentoService = require('./rendimentoService');

const MAX_DIAS = 400;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

const somarDias = (data, dias) => new Date(data.getTime() + dias * UM_DIA_MS);

function somarMeses(data, meses) {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + meses;
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(data.getUTCDate(), ultimoDia)));
}

function calcularAlvo(de, { dias, meses, ate }) {
  let alvo;
  if (dias !== undefined) alvo = somarDias(de, dias);
  else if (meses !== undefined) alvo = somarMeses(de, meses);
  else alvo = new Date(ate);
  const diasAvancados = Math.round((alvo - de) / UM_DIA_MS);
  if (!(diasAvancados >= 1)) throw badRequest('A nova data deve ser depois da data atual do sistema');
  if (diasAvancados > MAX_DIAS) throw badRequest(`Avance no máximo ${MAX_DIAS} dias por vez`);
  return { alvo, diasAvancados };
}

let avancando = false;

class TempoService {
  async sincronizarServidor() {
    if (avancando) throw conflict('O relógio já está avançando; aguarde terminar', 'relogio_ocupado');
    avancando = true;
    try {
      return await relogioService.sincronizarServidor();
    } finally {
      avancando = false;
    }
  }

  async avancar(pedido) {
    if (avancando) throw conflict('O relógio já está avançando; aguarde terminar', 'relogio_ocupado');
    avancando = true;
    try {
      const config = await relogioService.obterConfig();
      const { alvo, diasAvancados } = calcularAlvo(config.dataSistema, pedido);
      const resumo = {
        de: config.dataSistema,
        ate: alvo,
        dias: diasAvancados,
        recorrenciasExecutadas: 0,
        recorrenciasFalhas: 0,
        rendimentosCentavos: 0,
      };

      for (let dia = somarDias(config.dataSistema, 1); dia <= alvo; dia = somarDias(dia, 1)) {
        if (config.dataProcessadaAte && dia <= config.dataProcessadaAte) {
          await relogioService.definirData(dia);
          continue;
        }
        await rendimentoService.acumularDia(config, dia);
        if (dia.getUTCDate() === 1) resumo.rendimentosCentavos += await rendimentoService.lancarMes(dia);
        const { executadas, falhas } = await recorrenciaService.executarDoDia(dia);
        resumo.recorrenciasExecutadas += executadas;
        resumo.recorrenciasFalhas += falhas;
        await relogioService.definirData(dia, { processada: true });
      }
      return resumo;
    } finally {
      avancando = false;
    }
  }
}

module.exports = new TempoService();
