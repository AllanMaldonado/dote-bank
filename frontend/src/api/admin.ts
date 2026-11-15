import { http } from './http';

export const adminApi = {
  painel: () => http.get('/admin/painel'),

  listarClientes: (params) => http.get('/admin/clientes', { params }),
  obterCliente: (id) => http.get(`/admin/clientes/${id}`),
  atualizarCliente: (id, dados) => http.put(`/admin/clientes/${id}`, dados),
  excluirCliente: (id) => http.delete(`/admin/clientes/${id}`),
  mudarStatus: (id, acao) => http.patch(`/admin/clientes/${id}/${acao}`),

  obterConfig: () => http.get('/admin/config'),
  atualizarTaxas: (dados) => http.put('/admin/config/taxas', dados),
  avancarRelogio: (pedido) => http.post('/admin/relogio/avancar', pedido),
};
