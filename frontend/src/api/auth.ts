import { http } from './http';

export const authApi = {
  register: (dados) => http.post('/auth/register', dados),
  login: (email, senha) => http.post('/auth/login', { email, senha }),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/auth/me'),
  forgotPassword: (email) => http.post('/auth/forgot-password', { email }),
  resetPassword: (token, novaSenha) => http.post('/auth/reset-password', { token, novaSenha }),
};
