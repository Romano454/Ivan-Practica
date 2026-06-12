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
  if (error.response?.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
