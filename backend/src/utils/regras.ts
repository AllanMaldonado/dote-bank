const { TIPOS_CAIXINHA } = require('../models/constantes');

const idDe = (ref) => ref && String(ref._id ?? ref);

function direcaoPara(t, usuarioId) {
  if (TIPOS_CAIXINHA.includes(t.tipo)) return 'interno';
  const uid = String(usuarioId);
  const origem = idDe(t.origemId);
  const destino = idDe(t.destinoId);
  if (destino === uid && origem !== uid) return 'entrada';
  if (origem === uid && destino !== uid) return 'saida';
  return 'interno';
}

const taxasEfetivas = (c) => ({
  taxaCaixinhaAnual: (c.indicePointsAnual * c.percentualCaixinha) / 100,
});

module.exports = { direcaoPara, taxasEfetivas };
