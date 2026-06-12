import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessLogsService } from './access-logs.service';

@Controller('access-logs')
export class AccessLogsController {
  constructor(private readonly logs: AccessLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.logs.findAll();
  }
}
