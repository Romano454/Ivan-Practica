import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { AssistantService } from './assistant.service';
import { ChatRole } from './dto/chat.dto';

describe('AssistantService (modo básico, sin API key)', () => {
  let service: AssistantService;

  const cita = {
    time: '09:30',
    status: AppointmentStatus.PENDIENTE,
    patient: { firstName: 'Ana', lastName: 'Pérez' },
    doctor: { name: 'Dr. Soto' },
  };

  beforeEach(() => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const appointments = {
      find: jest.fn().mockResolvedValue([cita]),
      count: jest.fn().mockResolvedValue(3),
    };
    const doctors = {
      find: jest
        .fn()
        .mockResolvedValue([{ name: 'Dr. Soto', specialty: 'Odontología' }]),
    };
    const patients = { count: jest.fn().mockResolvedValue(12) };
    service = new AssistantService(
      config as unknown as ConfigService,
      appointments as unknown as Repository<Appointment>,
      doctors as unknown as Repository<Doctor>,
      patients as unknown as Repository<Patient>,
    );
  });

  const pregunta = (content: string) => [{ role: ChatRole.USER, content }];

  it('responde las citas de hoy con datos reales', async () => {
    const { reply } = await service.chat(pregunta('¿Qué citas hay hoy?'));
    expect(reply).toContain('09:30');
    expect(reply).toContain('Ana Pérez');
    expect(reply).toContain('Dr. Soto');
  });

  it('responde la cantidad de citas pendientes', async () => {
    const { reply } = await service.chat(pregunta('¿Cuántas pendientes hay?'));
    expect(reply).toContain('3');
  });

  it('responde los doctores con su especialidad', async () => {
    const { reply } = await service.chat(pregunta('¿Qué doctores atienden?'));
    expect(reply).toContain('Dr. Soto (Odontología)');
  });

  it('responde la cantidad de pacientes registrados', async () => {
    const { reply } = await service.chat(pregunta('¿Cuántos pacientes hay?'));
    expect(reply).toContain('12');
  });

  it('ofrece ejemplos cuando no entiende la pregunta', async () => {
    const { reply } = await service.chat(pregunta('hola'));
    expect(reply).toContain('Pruebe preguntas como');
  });
});
