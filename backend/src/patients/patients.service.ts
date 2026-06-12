import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private readonly repo: Repository<Patient>,
  ) {}

  findAll(search?: string): Promise<Patient[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .orderBy('p.lastName', 'ASC')
      .addOrderBy('p.firstName', 'ASC');
    if (search) {
      qb.where(
        'p.firstName ILIKE :s OR p.lastName ILIKE :s OR p.document ILIKE :s',
        { s: `%${search}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.repo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return patient;
  }

  async create(dto: CreatePatientDto): Promise<Patient> {
    await this.ensureDocumentFree(dto.document);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    if (dto.document && dto.document !== patient.document) {
      await this.ensureDocumentFree(dto.document);
    }
    Object.assign(patient, dto);
    return this.repo.save(patient);
  }

  // Eliminación lógica: el registro queda con deleted_at, nunca se borra físicamente
  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: 'Paciente eliminado' };
  }

  private async ensureDocumentFree(document: string): Promise<void> {
    const exists = await this.repo.findOne({
      where: { document },
      withDeleted: true,
    });
    if (exists) {
      throw new ConflictException('Ya existe un paciente con ese documento');
    }
  }
}
