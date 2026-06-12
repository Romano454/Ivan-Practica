import { api } from './client';
import { type SessionUser } from './auth';

export interface AccessLog {
  id: number;
  userId: number;
  user: SessionUser | null;
  ip: string;
  event: 'INGRESO' | 'SALIDA';
  browser: string;
  createdAt: string;
}

export const accessLogsApi = {
  list: () => api.get<AccessLog[]>('/access-logs').then((r) => r.data),
};
