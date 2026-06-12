import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  // Un 401 de login/registro es un error del formulario (credenciales o captcha),
  // no una sesión vencida: lo maneja la propia página, sin redirigir.
  const url: string = error.config?.url ?? '';
  const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
  if (error.response?.status === 401 && !isAuthAttempt) {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

// Convierte el message del backend (string o array de validación) en texto legible
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
