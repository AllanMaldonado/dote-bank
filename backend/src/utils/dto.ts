const { AGENCIA } = require('../models/constantes');
const { exibirPontos } = require('./dinheiro');
const { direcaoPara, taxasEfetivas } = require('./regras');
const { normalizarTipo, normalizarLink } = require('./compatibilidadeTransferencias');

const lista = (itens, mapear) => ({ itens: itens.map(mapear) });

const paginado = ({ pagina, limite }, { itens, total, ...extra }, mapear) => ({
  itens: itens.map(mapear),
  total,
  pagina,
  limite,
  ...extra,
});

const usuarioPublico = (u) =>
  u && {
    id: String(u._id),
    nome: u.nome,
    email: u.email,
    cpf: u.cpf,
    celular: u.celular,
    perfil: u.perfil,
    status: u.status,
    saldoCentavos: u.perfil === 'cliente' ? u.saldoCentavos : undefined,
    agencia: u.numeroConta ? AGENCIA : undefined,
    conta: u.numeroConta,
    criadoEm: u.createdAt,
  };

const resumoUsuario = (u) => (u?.nome ? { id: String(u._id), nome: u.nome } : null);

function mascararCpf(cpf) {
  const d = String(cpf ?? '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '';
}

const destinatarioPublico = ({ chave, destino }, usuarioId) => ({
  nome: destino.nome,
  cpf: mascararCpf(destino.cpf),
  banco: 'DOTE',
  tipoChave: chave.tipo,
  chave: chave.valor,
  propria: String(destino._id) === String(usuarioId),
});

const configPublica = (c) => ({
  dataSistema: c.dataSistema,
  indicePointsAnual: c.indicePointsAnual,
  percentualCaixinha: c.percentualCaixinha,
  ...taxasEfetivas(c),
});

const chavePublica = (c) => c && { id: String(c._id), tipo: c.tipo, valor: c.valor, criadaEm: c.createdAt };

const caixinhaPublica = (c) =>
  c && {
    id: String(c._id),
    nome: c.nome,
    metaCentavos: c.metaCentavos,
    saldoCentavos: c.saldoCentavos,
    progresso: c.metaCentavos ? Math.min(100, Math.round((c.saldoCentavos / c.metaCentavos) * 100)) : null,
    metaAtingida: Boolean(c.metaAtingidaEm),
    criadaEm: c.createdAt,
  };

const recorrenciaPublica = (r) =>
  r && {
    id: String(r._id),
    chaveDestino: r.chaveDestino,
    destinatario: r.destinatarioNome,
    valorCentavos: r.valorCentavos,
    diaDoMes: r.diaDoMes,
    categoria: r.categoria,
    descricao: r.descricao,
    ativa: r.ativa,
    ultimaExecucao: r.ultimaExecucao,
    ultimoStatus: r.ultimoStatus,
    criadaEm: r.createdAt,
  };

const contatoPublico = (c) =>
  c && {
    id: String(c._id),
    apelido: c.apelido,
    chave: c.chaveDestino,
    destinatario: c.destinatarioNome,
    criadoEm: c.createdAt,
  };

const notificacaoPublica = (n) =>
  n && {
    id: String(n._id),
    tipo: normalizarTipo(n.tipo),
    titulo: n.titulo,
    mensagem: exibirPontos(n.mensagem),
    link: normalizarLink(n.link),
    lida: n.lida,
    data: n.data,
  };

const transacaoPublica = (t, usuarioId) =>
  t && {
    id: String(t._id),
    codigo: t.codigo,
    tipo: normalizarTipo(t.tipo),
    direcao: direcaoPara(t, usuarioId),
    status: t.status,
    valorCentavos: t.valorCentavos,
    categoria: t.categoria,
    descricao: t.descricao,
    chaveDestino: t.chaveDestino,
    origem: resumoUsuario(t.origemId),
    destino: resumoUsuario(t.destinoId),
    caixinha: t.caixinhaNome || undefined,
    data: t.data,
    registradaEm: t.createdAt,
  };

module.exports = {
  lista,
  paginado,
  usuarioPublico,
  destinatarioPublico,
  configPublica,
  chavePublica,
  caixinhaPublica,
  recorrenciaPublica,
  contatoPublico,
  notificacaoPublica,
  transacaoPublica,
};
