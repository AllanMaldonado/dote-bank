const pontos = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(centavos) {
  const sinal = centavos < 0 ? '−' : '';
  return `${sinal}P$\u00a0${pontos.format(Math.abs(centavos) / 100)}`;
}

function exibirPontos(texto) {
  return texto.replace(/\bR\$(?=\s*\d)/g, 'P$');
}

module.exports = { formatMoney, exibirPontos };
