import { http } from './http';

export const transferenciasApi = {
  consultarDestinatario: (chave) => http.get('/transferencias/destinatario', { params: { chave } }),
  enviar: (dados) => http.post('/transferencias', dados),

  listarChaves: () => http.get('/transferencias/chaves'),
  criarChave: (tipo) => http.post('/transferencias/chaves', { tipo }),
  regenerarChave: (id) => http.put(`/transferencias/chaves/${id}`),
  excluirChave: (id) => http.delete(`/transferencias/chaves/${id}`),

  listarAgendamentos: () => http.get('/transferencias/agendamentos'),
  criarAgendamento: (dados) => http.post('/transferencias/agendamentos', dados),
  atualizarAgendamento: (id, dados) => http.put(`/transferencias/agendamentos/${id}`, dados),
  definirAgendamentoAtivo: (id, ativa) => http.patch(`/transferencias/agendamentos/${id}/ativa`, { ativa }),
  excluirAgendamento: (id) => http.delete(`/transferencias/agendamentos/${id}`),
};
