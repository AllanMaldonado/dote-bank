import { http } from './http';

export const contaApi = {
  resumo: () => http.get('/conta'),
  atualizarPerfil: (dados) => http.patch('/conta/perfil', dados),
  trocarSenha: (dados) => http.put('/conta/senha', dados),
};
