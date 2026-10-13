import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AccessUser } from '../auth/token.service';
import { parseBody } from '../common/zod';
import { ORDER_STATUSES } from './order-status';
import { OrdersService } from './orders.service';

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
});

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const idSchema = z.string().uuid();

@ApiTags('ordens')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list() {
    return this.orders.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.orders.create(parseBody(createOrderSchema, body));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(parseBody(idSchema, id));
  }

  @Patch(':id/status')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: [...ORDER_STATUSES] },
      },
    },
  })
  transition(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AccessUser) {
    const input = parseBody(statusSchema, body);
    return this.orders.transition(parseBody(idSchema, id), input.status, user.sub);
  }

  @Post(':id/photos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  addPhoto(
    @Param('id') id: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string } | undefined,
  ) {
    return this.orders.addPhoto(parseBody(idSchema, id), file);
  }

  @Get(':id/photos/:photoId')
  async readPhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    const photo = await this.orders.readPhoto(parseBody(idSchema, id), parseBody(idSchema, photoId));
    return new StreamableFile(photo.body, { type: photo.contentType });
  }
}
