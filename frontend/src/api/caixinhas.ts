import { http } from './http';

export const caixinhasApi = {
  listar: () => http.get('/caixinhas'),
  criar: (dados) => http.post('/caixinhas', dados),
  atualizar: (id, dados) => http.put(`/caixinhas/${id}`, dados),
  excluir: (id) => http.delete(`/caixinhas/${id}`),
  guardar: (id, valorCentavos) => http.post(`/caixinhas/${id}/aplicar`, { valorCentavos }),
  resgatar: (id, valorCentavos) => http.post(`/caixinhas/${id}/resgatar`, { valorCentavos }),
};
