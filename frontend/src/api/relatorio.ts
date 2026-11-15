import { http } from './http';

export type FiltrosRelatorio = { clienteId?: string; inicio?: string; fim?: string; categoria?: string };

const base = (clienteId) => (clienteId ? `/admin/clientes/${clienteId}/relatorio` : '/relatorio');

export const relatorioApi = {
  obter: ({ clienteId, inicio, fim, categoria }: FiltrosRelatorio = {}) => http.get(base(clienteId), { params: { inicio, fim, categoria } }),
  analisar: ({ clienteId, inicio, fim, categoria }: FiltrosRelatorio = {}) =>
    http.post(`${base(clienteId)}/analise`, { inicio, fim, categoria }),
};
