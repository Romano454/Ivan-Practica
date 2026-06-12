import { api } from './client';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string | null;
  createdAt: string;
}

export interface DoctorInput {
  name: string;
  specialty: string;
  phone: string;
  email?: string;
}

export const doctorsApi = {
  list: (search?: string) =>
    api
      .get<Doctor[]>('/doctors', { params: { search: search || undefined } })
      .then((r) => r.data),
  create: (data: DoctorInput) =>
    api.post<Doctor>('/doctors', data).then((r) => r.data),
  update: (id: number, data: Partial<DoctorInput>) =>
    api.patch<Doctor>(`/doctors/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/doctors/${id}`).then((r) => r.data),
};
