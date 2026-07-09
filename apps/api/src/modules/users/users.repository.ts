import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateUserInput {
  supabaseUserId: string;
  email: string;
  name: string;
  emailVerified?: boolean;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { supabaseUserId } });
  }

  create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        supabaseUserId: data.supabaseUserId,
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        emailVerified: data.emailVerified ?? false,
      },
    });
  }
}
