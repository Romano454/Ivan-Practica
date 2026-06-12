import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Ingrese su contraseña' })
  password: string;

  @IsString()
  captchaToken: string;
}
