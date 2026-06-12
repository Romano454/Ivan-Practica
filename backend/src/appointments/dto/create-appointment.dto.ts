import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsInt({ message: 'Seleccione un paciente' })
  patientId: number;

  @IsInt({ message: 'Seleccione un doctor' })
  doctorId: number;

  @IsDateString({}, { message: 'La fecha no es válida' })
  date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora debe tener formato HH:mm',
  })
  time: string;

  @IsString()
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El motivo no puede superar 200 caracteres' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes?: string;
}
