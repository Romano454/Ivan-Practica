import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// El paquete pdfmake no publica tipos para su uso en servidor (PdfPrinter),
// por eso el require dinámico tipado a mano.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake') as new (
  fonts: Record<string, Record<string, string>>,
) => {
  createPdfKitDocument(def: TDocumentDefinitions): NodeJS.ReadableStream & {
    end(): void;
  };
};
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/appointment.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';

export interface ReportFilters {
  from?: string;
  to?: string;
  doctorId?: number;
}

// Fuentes estándar de PDF: no requieren archivos externos
const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
  ) {}

  async appointmentsPdf(filters: ReportFilters): Promise<Buffer> {
    const qb = this.appointments
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.time', 'ASC');
    if (filters.from) qb.andWhere('a.date >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.date <= :to', { to: filters.to });
    if (filters.doctorId)
      qb.andWhere('a.doctorId = :doctorId', { doctorId: filters.doctorId });
    const rows = await qb.getMany();

    const filterParts: string[] = [];
    if (filters.from) filterParts.push(`Desde: ${filters.from}`);
    if (filters.to) filterParts.push(`Hasta: ${filters.to}`);
    if (filters.doctorId && rows[0]?.doctor) {
      filterParts.push(`Doctor: ${rows[0].doctor.name}`);
    }

    const byStatus = (status: AppointmentStatus) =>
      rows.filter((r) => r.status === status).length;

    const def: TDocumentDefinitions = {
      pageSize: 'LETTER',
      pageMargins: [40, 50, 40, 50],
      footer: (page, total) => ({
        text: `Página ${page} de ${total}`,
        alignment: 'center',
        fontSize: 8,
        color: '#888888',
      }),
      content: [
        { text: 'MediCitas — Reporte de Citas', style: 'title' },
        {
          text: filterParts.length ? filterParts.join('   |   ') : 'Todas las citas',
          style: 'subtitle',
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', '*', '*', 'auto'],
            body: [
              ['Fecha', 'Hora', 'Paciente', 'Doctor', 'Motivo', 'Estado'].map(
                (h) => ({ text: h, style: 'th' }),
              ),
              ...rows.map((r) => [
                r.date,
                r.time,
                r.patient
                  ? `${r.patient.lastName}, ${r.patient.firstName}`
                  : '—',
                r.doctor?.name ?? '—',
                r.reason,
                r.status,
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          fontSize: 9,
        },
        {
          text: [
            `\nTotal de citas: ${rows.length}    `,
            `Pendientes: ${byStatus(AppointmentStatus.PENDIENTE)}    `,
            `Atendidas: ${byStatus(AppointmentStatus.ATENDIDA)}    `,
            `Canceladas: ${byStatus(AppointmentStatus.CANCELADA)}`,
          ].join(''),
          style: 'summary',
        },
        {
          text: `Generado el ${new Date().toLocaleString('es-BO')}`,
          fontSize: 8,
          color: '#888888',
          margin: [0, 12, 0, 0],
        },
      ],
      styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 10, color: '#555555', margin: [0, 0, 0, 12] },
        th: { bold: true, fillColor: '#00796b', color: '#ffffff', fontSize: 9 },
        summary: { fontSize: 10, bold: true, margin: [0, 10, 0, 0] },
      },
      defaultStyle: { font: 'Helvetica' },
    };

    const printer = new PdfPrinter(FONTS);
    const doc = printer.createPdfKitDocument(def);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  async stats() {
    const [byMonth, byDoctor, byStatus] = await Promise.all([
      this.appointments
        .createQueryBuilder('a')
        .select(`to_char(a.date, 'YYYY-MM')`, 'month')
        .addSelect('COUNT(*)::int', 'total')
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany<{ month: string; total: number }>(),
      this.appointments
        .createQueryBuilder('a')
        .leftJoin('a.doctor', 'd')
        .select('d.name', 'doctor')
        .addSelect('COUNT(*)::int', 'total')
        .groupBy('d.name')
        .orderBy('total', 'DESC')
        .getRawMany<{ doctor: string; total: number }>(),
      this.appointments
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)::int', 'total')
        .groupBy('a.status')
        .getRawMany<{ status: string; total: number }>(),
    ]);
    const [patients, doctors, appointments, pending] = await Promise.all([
      this.patients.count(),
      this.doctors.count(),
      this.appointments.count(),
      this.appointments.count({
        where: { status: AppointmentStatus.PENDIENTE },
      }),
    ]);
    return {
      counts: { patients, doctors, appointments, pending },
      byMonth,
      byDoctor,
      byStatus,
    };
  }
}
