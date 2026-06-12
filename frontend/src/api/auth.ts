import { api } from './client';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'RECEPCIONISTA';
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export const authApi = {
  login: (data: { email: string; password: string; captchaToken: string }) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: {
    name: string;
    email: string;
    password: string;
    captchaToken: string;
  }) => api.post('/auth/register', data).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};
