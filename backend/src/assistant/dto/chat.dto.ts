import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class ChatMessageDto {
  @IsEnum(ChatRole, { message: 'Rol de mensaje inválido' })
  role: ChatRole;

  @IsString()
  @MinLength(1, { message: 'El mensaje no puede estar vacío' })
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  content: string;
}

export class ChatDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe enviar al menos un mensaje' })
  @ArrayMaxSize(20, { message: 'Historial demasiado largo' })
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
