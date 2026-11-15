import { http } from './http';

export const contatosApi = {
  listar: () => http.get('/contatos'),
  criar: (dados) => http.post('/contatos', dados),
  atualizar: (id, dados) => http.put(`/contatos/${id}`, dados),
  excluir: (id) => http.delete(`/contatos/${id}`),
};
