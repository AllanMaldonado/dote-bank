const digitos = (v) => String(v ?? '').replace(/\D/g, '');

export const obrigatorio = (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Campo obrigatório';

export const email = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim()) || 'Informe um e-mail válido';

export const cpf = (v) => {
  const d = digitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return 'Informe um CPF válido';
  const calc = (tam) => {
    const soma = [...d.slice(0, tam)].reduce((acc, n, i) => acc + Number(n) * (tam + 1 - i), 0);
    return ((soma * 10) % 11) % 10;
  };
  return (calc(9) === Number(d[9]) && calc(10) === Number(d[10])) || 'Informe um CPF válido';
};

export const celular = (v) => {
  const d = digitos(v);
  return d === '' || /^[1-9]{2}9\d{8}$/.test(d) || 'Celular com DDD + 9 dígitos';
};

export const senha = (v) => {
  const s = String(v ?? '');
  if (s.length < 8) return 'A senha precisa ter ao menos 8 caracteres';
  return s.length <= 72 || 'A senha pode ter no máximo 72 caracteres';
};

export const iguais =
  (fn, mensagem = 'As senhas não conferem') =>
  (v) =>
    v === fn() || mensagem;
