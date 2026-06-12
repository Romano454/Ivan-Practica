import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly repo: Repository<Doctor>,
  ) {}

  findAll(search?: string): Promise<Doctor[]> {
    const qb = this.repo.createQueryBuilder('d').orderBy('d.name', 'ASC');
    if (search) {
      qb.where('d.name ILIKE :s OR d.specialty ILIKE :s', { s: `%${search}%` });
    }
    return qb.getMany();
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.repo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor no encontrado');
    return doctor;
  }

  create(dto: CreateDoctorDto): Promise<Doctor> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, dto);
    return this.repo.save(doctor);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'Doctor eliminado' };
  }
}
