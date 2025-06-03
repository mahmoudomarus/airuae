import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(
    @Body() userData: { email: string; password: string; firstName?: string; lastName?: string },
  ): Promise<User> {
    return this.usersService.create(userData);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() userData: { firstName?: string; lastName?: string; email?: string; password?: string },
  ): Promise<User> {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<User> {
    return this.usersService.delete(id);
  }
}
