const Config = require('../models/Config');

const ID = 'global';
const inicioDoDiaUTC = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const NA_CRIACAO = { $setOnInsert: { dataSistema: inicioDoDiaUTC() } };
const UPSERT = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true, lean: true };

class RelogioService {
  async obterConfig() {
    return (await Config.findById(ID).lean()) ?? Config.findOneAndUpdate({ _id: ID }, NA_CRIACAO, UPSERT);
  }

  async agora() {
    return (await this.obterConfig()).dataSistema;
  }

  atualizarTaxas({ indicePointsAnual, percentualCaixinha }) {
    const taxas = { indicePointsAnual, percentualCaixinha };
    for (const campo of Object.keys(taxas)) if (taxas[campo] === undefined) delete taxas[campo];
    return Config.findOneAndUpdate({ _id: ID }, { $set: taxas, ...NA_CRIACAO }, UPSERT);
  }

  definirData(data, { processada = false } = {}) {
    const dia = inicioDoDiaUTC(data);
    return Config.findOneAndUpdate(
      { _id: ID },
      { $set: { dataSistema: dia }, ...(processada && { $max: { dataProcessadaAte: dia } }) },
      UPSERT,
    );
  }
}

module.exports = new RelogioService();
