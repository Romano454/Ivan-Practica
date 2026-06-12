import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll() {
    return this.service.findAllWithDeleted();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.adminCreate(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: AuthUser,
  ) {
    // Un admin no puede desactivarse ni degradarse a sí mismo
    if (
      id === me.userId &&
      (dto.isActive === false || (dto.role && dto.role !== UserRole.ADMIN))
    ) {
      throw new ForbiddenException(
        'No puede desactivar ni cambiar el rol de su propia cuenta',
      );
    }
    return this.service.adminUpdate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: AuthUser) {
    if (id === me.userId) {
      throw new ForbiddenException('No puede eliminar su propia cuenta');
    }
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
