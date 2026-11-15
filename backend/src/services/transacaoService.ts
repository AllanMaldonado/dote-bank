const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Transacao = require('../models/Transacao');
const { POPULAR_PARTES, TIPOS_CAIXINHA } = require('../models/constantes');
const { notFound } = require('../utils/AppError');
const { escaparRegex } = require('../utils/validacao');

function gerarCodigo(data) {
  const dia = data.toISOString().slice(0, 10).replaceAll('-', '');
  return `DOTE${dia}${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

const FILTRO_POR_DIRECAO = {
  entrada: (uid) => ({ destinoId: uid, origemId: { $ne: uid }, tipo: { $nin: TIPOS_CAIXINHA } }),
  saida: (uid) => ({ origemId: uid, destinoId: { $ne: uid }, tipo: { $nin: TIPOS_CAIXINHA } }),
  caixinha: (uid) => ({ origemId: uid, tipo: { $in: TIPOS_CAIXINHA } }),
};

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function filtroExtrato(usuarioId, { inicio, fim, direcao, categoria, busca }) {
  const uid = new mongoose.Types.ObjectId(String(usuarioId));
  const filtro = direcao ? FILTRO_POR_DIRECAO[direcao](uid) : { $or: [{ origemId: uid }, { destinoId: uid }] };
  if (inicio || fim) {
    filtro.data = {};
    if (inicio) filtro.data.$gte = inicio;
    if (fim) filtro.data.$lt = new Date(fim.getTime() + UM_DIA_MS);  
  }
  if (categoria) filtro.categoria = categoria;
  if (busca) filtro.descricao = new RegExp(escaparRegex(busca), 'i');
  return filtro;
}

class TransacaoService {
  registrar(dados) {
    return Transacao.create({ ...dados, codigo: gerarCodigo(dados.data) });
  }

  async extrato(usuarioId, filtros, { pular, limite }) {
    const filtro = filtroExtrato(usuarioId, filtros);
    const [itens, total] = await Promise.all([
      Transacao.find(filtro)
        .sort({ data: -1, createdAt: -1 })
        .skip(pular)
        .limit(limite)
        .populate(POPULAR_PARTES)
        .lean(),
      Transacao.countDocuments(filtro),
    ]);
    return { itens, total };
  }

  async obter(id, { usuarioId, verTodas = false }) {
    const t = await Transacao.findById(id).populate(POPULAR_PARTES).lean();
    const uid = String(usuarioId);
    const parte = t && [t.origemId?._id, t.destinoId?._id].some((p) => p && String(p) === uid);
    if (!t || (!parte && !verTodas)) throw notFound('Transação não encontrada');
    return t;
  }
}

module.exports = new TransacaoService();
