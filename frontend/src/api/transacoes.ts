import { http } from './http';

export const transacoesApi = {
  listar: (filtros) => http.get('/transacoes', { params: filtros }),
  comprovante: (id) => http.get(`/transacoes/${id}`),
};
