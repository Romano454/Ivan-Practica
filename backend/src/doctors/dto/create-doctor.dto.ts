import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres' })
  name: string;

  @IsString()
  @MinLength(3, { message: 'La especialidad debe tener al menos 3 caracteres' })
  @MaxLength(60, { message: 'La especialidad no puede superar 60 caracteres' })
  specialty: string;

  @IsString()
  @Matches(/^[0-9+\s-]{6,20}$/, { message: 'El teléfono no es válido' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;
}
