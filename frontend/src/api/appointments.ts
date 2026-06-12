import { api } from './client';
import { type Doctor } from './doctors';
import { type Patient } from './patients';

export type AppointmentStatus = 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA';

export interface Appointment {
  id: number;
  patientId: number;
  patient: Patient;
  doctorId: number;
  doctor: Doctor;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
}

export interface AppointmentInput {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  notes?: string;
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: number;
  status?: AppointmentStatus;
}

export const appointmentsApi = {
  list: (filters: AppointmentFilters = {}) =>
    api
      .get<Appointment[]>('/appointments', {
        params: {
          date: filters.date || undefined,
          doctorId: filters.doctorId || undefined,
          status: filters.status || undefined,
        },
      })
      .then((r) => r.data),
  create: (data: AppointmentInput) =>
    api.post<Appointment>('/appointments', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<AppointmentInput> & { status?: AppointmentStatus },
  ) => api.patch<Appointment>(`/appointments/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/appointments/${id}`).then((r) => r.data),
};
