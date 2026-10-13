import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.customer.findMany({ orderBy: { name: 'asc' } });
  }

  async create(input: { name: string; phone?: string; email?: string }) {
    return this.prisma.customer.create({
      data: {
        id: randomUUID(),
        name: input.name,
        phone: input.phone,
        email: input.email,
      },
    });
  }

  async findOrThrow(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }
}
