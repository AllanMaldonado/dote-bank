const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
const diaMes = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
const mesAno = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'short', year: '2-digit' });

export const formatData = (iso) => (iso ? dia.format(new Date(iso)) : '');
export const formatDiaMes = (iso) => (iso ? diaMes.format(new Date(iso)) : '');
export const formatMes = (chave) =>
  mesAno
    .format(new Date(`${chave}-01T00:00:00Z`))
    .replace('. de ', '/')
    .replace('.', '');
export const isoDia = (d) => new Date(d).toISOString().slice(0, 10);
const mesCurto = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'short' });
export const formatMesCurto = (chave) => mesCurto.format(new Date(`${chave}-01T00:00:00Z`)).replace('.', '');
