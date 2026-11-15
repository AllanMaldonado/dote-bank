const tiposAnteriores = {
  pix: 'transferencia',
  pix_recebido: 'transferencia_recebida',
  pix_enviado: 'transferencia_enviada',
};

const prefixoAnterior = '/pix';
const colecaoChaves = 'chavespix';
const tiposTransferencia = ['transferencia', 'pix'];
const tiposNotificacaoAnteriores = ['pix_recebido', 'pix_enviado'];
const normalizarTipo = (tipo) => tiposAnteriores[tipo] ?? tipo;
const normalizarLink = (link) =>
  link?.replace(/^\/pix(?=\/|$)/, '/transferencias');

module.exports = {
  prefixoAnterior,
  colecaoChaves,
  tiposTransferencia,
  tiposNotificacaoAnteriores,
  normalizarTipo,
  normalizarLink,
};
