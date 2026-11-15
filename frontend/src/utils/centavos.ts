export function paraCentavos(texto) {
  const limpo = String(texto ?? '')
    .trim()
    .replace(/\s|^[PR]\$/g, '');
  if (!limpo) return null;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  return Math.round(Number(normalizado) * 100);
}

export const centavosParaTexto = (centavos) => (centavos == null ? '' : (centavos / 100).toFixed(2).replace('.', ','));
