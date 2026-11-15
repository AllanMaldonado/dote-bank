import { http } from './http';

export const pixApi = {
  consultarDestinatario: (chave) => http.get('/pix/destinatario', { params: { chave } }),
  enviar: (dados) => http.post('/pix/transferencias', dados),

  listarChaves: () => http.get('/pix/chaves'),
  criarChave: (tipo) => http.post('/pix/chaves', { tipo }),
  regenerarChave: (id) => http.put(`/pix/chaves/${id}`),
  excluirChave: (id) => http.delete(`/pix/chaves/${id}`),

  listarAgendamentos: () => http.get('/pix/agendamentos'),
  criarAgendamento: (dados) => http.post('/pix/agendamentos', dados),
  atualizarAgendamento: (id, dados) => http.put(`/pix/agendamentos/${id}`, dados),
  definirAgendamentoAtivo: (id, ativa) => http.patch(`/pix/agendamentos/${id}/ativa`, { ativa }),
  excluirAgendamento: (id) => http.delete(`/pix/agendamentos/${id}`),
};
