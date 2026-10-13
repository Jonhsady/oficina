import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { parseBody } from '../common/zod';
import { EquipmentService } from './equipment.service';

const createEquipmentSchema = z.object({
  customerId: z.string().uuid(),
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  serial: z.string().max(80).optional(),
});

@ApiTags('equipamentos')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  list(@Query('customerId') customerId?: string) {
    if (customerId) parseBody(z.string().uuid(), customerId);
    return this.equipment.list(customerId);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.equipment.create(parseBody(createEquipmentSchema, body));
  }
}
