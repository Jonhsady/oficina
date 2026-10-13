import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { parseBody } from '../common/zod';
import { CustomersService } from './customers.service';

const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list() {
    return this.customers.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.customers.create(parseBody(createCustomerSchema, body));
  }
}
