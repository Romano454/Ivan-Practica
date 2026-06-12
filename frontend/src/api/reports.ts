import { api } from './client';

export interface Stats {
  counts: {
    patients: number;
    doctors: number;
    appointments: number;
    pending: number;
  };
  byMonth: { month: string; total: number }[];
  byDoctor: { doctor: string; total: number }[];
  byStatus: { status: string; total: number }[];
}

export interface ReportFilters {
  from?: string;
  to?: string;
  doctorId?: number;
}

export const reportsApi = {
  stats: () => api.get<Stats>('/reports/stats').then((r) => r.data),
  appointmentsPdf: (filters: ReportFilters) =>
    api
      .get<Blob>('/reports/appointments.pdf', {
        params: {
          from: filters.from || undefined,
          to: filters.to || undefined,
          doctorId: filters.doctorId || undefined,
        },
        responseType: 'blob',
      })
      .then((r) => r.data),
};
