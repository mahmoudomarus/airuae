import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(data.password);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      profileImage?: string;
      phone?: string;
    },
  ): Promise<User> {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await this.hashPassword(data.password);
      delete updateData.password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
