import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
  ) {}

  list(customerId?: string) {
    return this.prisma.equipment.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { brand: 'asc' },
    });
  }

  async create(input: { customerId: string; brand: string; model: string; serial?: string }) {
    await this.customers.findOrThrow(input.customerId);
    return this.prisma.equipment.create({
      data: {
        id: randomUUID(),
        customerId: input.customerId,
        brand: input.brand,
        model: input.model,
        serial: input.serial,
      },
    });
  }
}
