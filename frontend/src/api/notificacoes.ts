import { http } from './http';

export const notificacoesApi = {
  listar: (params) => http.get('/notificacoes', { params }),
  marcarLida: (id) => http.patch(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () => http.patch('/notificacoes/lidas'),
  excluir: (id) => http.delete(`/notificacoes/${id}`),
};
