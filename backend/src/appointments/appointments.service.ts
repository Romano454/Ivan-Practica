import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { DoctorsService } from '../doctors/doctors.service';
import { PatientsService } from '../patients/patients.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export interface AppointmentFilters {
  date?: string;
  doctorId?: number;
  status?: AppointmentStatus;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    private readonly patients: PatientsService,
    private readonly doctors: DoctorsService,
  ) {}

  findAll(filters: AppointmentFilters): Promise<Appointment[]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .orderBy('a.date', 'DESC')
      .addOrderBy('a.time', 'ASC');
    if (filters.date) qb.andWhere('a.date = :date', { date: filters.date });
    if (filters.doctorId)
      qb.andWhere('a.doctorId = :doctorId', { doctorId: filters.doctorId });
    if (filters.status)
      qb.andWhere('a.status = :status', { status: filters.status });
    return qb.getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    return appointment;
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // findOne lanza 404 si el paciente/doctor no existe o fue eliminado
    await this.patients.findOne(dto.patientId);
    await this.doctors.findOne(dto.doctorId);
    await this.ensureSlotFree(dto.doctorId, dto.date, dto.time);
    const appointment = this.repo.create(dto);
    const saved = await this.repo.save(appointment);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (dto.patientId && dto.patientId !== appointment.patientId) {
      await this.patients.findOne(dto.patientId);
    }
    if (dto.doctorId && dto.doctorId !== appointment.doctorId) {
      await this.doctors.findOne(dto.doctorId);
    }
    const doctorId = dto.doctorId ?? appointment.doctorId;
    const date = dto.date ?? appointment.date;
    const time = dto.time ?? appointment.time;
    const slotChanged =
      doctorId !== appointment.doctorId ||
      date !== appointment.date ||
      time !== appointment.time;
    if (slotChanged) {
      await this.ensureSlotFree(doctorId, date, time, id);
    }
    Object.assign(appointment, dto);
    await this.repo.save(appointment);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'Cita eliminada' };
  }

  // Un doctor no puede tener dos citas activas en el mismo horario
  private async ensureSlotFree(
    doctorId: number,
    date: string,
    time: string,
    excludeId?: number,
  ): Promise<void> {
    const where = {
      doctorId,
      date,
      time,
      status: Not(AppointmentStatus.CANCELADA),
      ...(excludeId ? { id: Not(excludeId) } : {}),
    };
    const clash = await this.repo.findOne({ where });
    if (clash) {
      throw new ConflictException(
        'El doctor ya tiene una cita en esa fecha y hora',
      );
    }
  }
}
