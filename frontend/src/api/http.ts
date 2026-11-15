import axios, { type AxiosRequestConfig } from 'axios';
import { getToken } from './token';


export class ApiError extends Error {
  constructor(public status: number, public codigo: string | undefined, mensagem: string) {
    super(mensagem);
  }
}

let aoExpirarSessao = () => {};

export function definirAoExpirarSessao(fn) {
  aoExpirarSessao = fn;
}

const SEM_REDIRECIONAR = ['/auth/login', '/auth/register', '/auth/me', '/auth/forgot-password', '/auth/reset-password'];

const origemApi = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') ?? '';

const cliente = axios.create({
  baseURL: origemApi ? origemApi + '/api' : '/api',
  timeout: 20_000,
});

cliente.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.params) {
    config.params = Object.fromEntries(
      Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
  }
  return config;
});

cliente.interceptors.response.use(
  (resposta) => resposta.data,
  (erro) => {
    if (!erro.response) {
      const tempo = erro.code === 'ECONNABORTED';
      return Promise.reject(
        new ApiError(
          0,
          tempo ? 'tempo_esgotado' : 'sem_conexao',
          tempo ? 'O servidor demorou para responder.' : 'Não foi possível falar com o servidor.',
        ),
      );
    }
    const { status, data } = erro.response;
    if (status === 401 && !SEM_REDIRECIONAR.includes(erro.config?.url)) aoExpirarSessao();
    return Promise.reject(new ApiError(status, data?.codigo, data?.message ?? 'Erro inesperado do servidor.'));
  },
);

export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => cliente.get<unknown, T>(url, config),
  delete: <T = any>(url: string) => cliente.delete<unknown, T>(url),
  post: <T = any>(url: string, dados?: unknown, config?: AxiosRequestConfig) => cliente.post<unknown, T>(url, dados, config),
  put: <T = any>(url: string, dados?: unknown) => cliente.put<unknown, T>(url, dados),
  patch: <T = any>(url: string, dados?: unknown) => cliente.patch<unknown, T>(url, dados),
};
