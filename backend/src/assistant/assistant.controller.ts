import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto/chat.dto';

// Accesible para cualquier usuario autenticado
@Controller('assistant')
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post('chat')
  @HttpCode(200)
  chat(@Body() dto: ChatDto) {
    return this.service.chat(dto.messages);
  }
}
