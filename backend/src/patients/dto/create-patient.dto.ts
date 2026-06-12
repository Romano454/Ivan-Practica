import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '../patient.entity';

export class CreatePatientDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede superar 60 caracteres' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El apellido no puede superar 60 caracteres' })
  lastName: string;

  @IsString()
  @Matches(/^[0-9A-Za-z.-]{4,20}$/, {
    message: 'El documento debe tener entre 4 y 20 caracteres (letras, números, punto o guion)',
  })
  document: string;

  @IsString()
  @Matches(/^[0-9+\s-]{6,20}$/, { message: 'El teléfono no es válido' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Género inválido' })
  gender?: Gender;
}
