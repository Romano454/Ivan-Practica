import { api } from './client';

export type UserRole = 'ADMIN' | 'RECEPCIONISTA';

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const usersApi = {
  list: () => api.get<ManagedUser[]>('/users').then((r) => r.data),
  create: (data: CreateUserInput) =>
    api.post<ManagedUser>('/users', data).then((r) => r.data),
  update: (id: number, data: UpdateUserInput) =>
    api.patch<ManagedUser>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
  restore: (id: number) =>
    api.patch(`/users/${id}/restore`).then((r) => r.data),
};
