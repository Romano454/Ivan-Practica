import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/appointment.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly client: Anthropic | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    // Sin API key el asistente funciona en modo básico (respuestas por reglas)
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async chat(messages: ChatMessageDto[]): Promise<{ reply: string }> {
    const context = await this.buildContext();
    if (!this.client) {
      const lastMessage = messages[messages.length - 1].content;
      return { reply: this.ruleBasedReply(lastMessage, context) };
    }
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system: this.systemPrompt(context),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      return { reply: reply || 'No tengo una respuesta para eso.' };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        this.logger.warn(`Error de la API de Claude: ${error.status} ${error.message}`);
      } else {
        this.logger.warn(`Error inesperado del asistente: ${String(error)}`);
      }
      // El asistente nunca rompe la experiencia: cae al modo básico
      const lastMessage = messages[messages.length - 1].content;
      return { reply: this.ruleBasedReply(lastMessage, context) };
    }
  }

  private systemPrompt(context: string): string {
    return [
      'Eres el asistente virtual de MediCitas, un sistema de gestión de citas',
      'médicas usado por recepcionistas y administradores de un consultorio.',
      'Respondes SIEMPRE en español, de forma breve y útil (máximo 4 oraciones).',
      'Solo respondes preguntas relacionadas con el consultorio: citas, pacientes,',
      'doctores y el uso del sistema. Si te preguntan otra cosa, indica amablemente',
      'que solo puedes ayudar con temas del consultorio.',
      'No inventes datos: usa únicamente la información del contexto siguiente.',
      '',
      '=== Datos actuales del consultorio ===',
      context,
    ].join('\n');
  }

  // Contexto compacto con los datos del día para que el modelo responda con cifras reales
  private async buildContext(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const [todayAppointments, pending, totalPatients, doctors] =
      await Promise.all([
        this.appointments.find({ where: { date: today } }),
        this.appointments.count({
          where: { status: AppointmentStatus.PENDIENTE },
        }),
        this.patients.count(),
        this.doctors.find(),
      ]);
    const lines = [
      `Fecha de hoy: ${today}`,
      `Citas de hoy (${todayAppointments.length}):`,
      ...todayAppointments.map(
        (a) =>
          `- ${a.time} | ${a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Paciente'} con ${a.doctor?.name ?? 'doctor'} | ${a.status}`,
      ),
      `Citas pendientes en total: ${pending}`,
      `Pacientes registrados: ${totalPatients}`,
      `Doctores (${doctors.length}): ${doctors.map((d) => `${d.name} (${d.specialty})`).join(', ') || 'ninguno'}`,
    ];
    return lines.join('\n');
  }

  private ruleBasedReply(message: string, context: string): string {
    const q = message.toLowerCase();
    const contextBlock = (label: string) =>
      context
        .split('\n')
        .filter((l) => l.toLowerCase().includes(label))
        .join('\n');
    if (q.includes('hoy')) {
      const citas = context
        .split('\n')
        .filter((l) => l.startsWith('- ') || l.startsWith('Citas de hoy'));
      return citas.length > 1
        ? `Estas son las citas de hoy:\n${citas.join('\n')}`
        : 'Hoy no hay citas registradas.';
    }
    if (q.includes('pendiente')) {
      return contextBlock('pendientes') || 'No hay citas pendientes.';
    }
    if (q.includes('doctor')) {
      return contextBlock('doctores') || 'No hay doctores registrados.';
    }
    if (q.includes('paciente')) {
      return contextBlock('pacientes registrados') || 'No hay pacientes registrados.';
    }
    return [
      'Puedo ayudarle con información del consultorio. Pruebe preguntas como:',
      '• ¿Qué citas hay hoy?',
      '• ¿Cuántas citas pendientes hay?',
      '• ¿Qué doctores atienden?',
      '• ¿Cuántos pacientes hay registrados?',
    ].join('\n');
  }
}
