import { api } from './client';

export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  document: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  gender: Gender;
  createdAt: string;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  document: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender?: Gender;
}

export const patientsApi = {
  list: (search?: string) =>
    api
      .get<Patient[]>('/patients', { params: { search: search || undefined } })
      .then((r) => r.data),
  create: (data: PatientInput) =>
    api.post<Patient>('/patients', data).then((r) => r.data),
  update: (id: number, data: Partial<PatientInput>) =>
    api.patch<Patient>(`/patients/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/patients/${id}`).then((r) => r.data),
};
