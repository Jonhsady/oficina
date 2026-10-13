import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { OrdersGateway } from './orders.gateway';
import { assertCanTransition, InvalidOrderTransition, type OrderStatus } from './order-status';
import { orderInclude, toOrderView, type OrderView } from './order.view';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gateway: OrdersGateway,
  ) {}

  async list(): Promise<OrderView[]> {
    const orders = await this.prisma.serviceOrder.findMany({
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return orders.map(toOrderView);
  }

  async get(id: string): Promise<OrderView> {
    return toOrderView(await this.findRecord(id));
  }

  async create(input: {
    customerId: string;
    equipmentId: string;
    title: string;
    description?: string;
  }): Promise<OrderView> {
    const customer = await this.prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const equipment = await this.prisma.equipment.findUnique({ where: { id: input.equipmentId } });
    if (!equipment) throw new NotFoundException('Equipamento não encontrado');
    if (equipment.customerId !== input.customerId) {
      throw new UnprocessableEntityException('Equipamento não pertence ao cliente');
    }

    const order = await this.prisma.serviceOrder.create({
      data: {
        id: randomUUID(),
        customerId: input.customerId,
        equipmentId: input.equipmentId,
        title: input.title,
        description: input.description,
      },
      include: orderInclude,
    });
    const view = toOrderView(order);
    this.gateway.emitUpdated(view);
    return view;
  }

  async transition(id: string, next: OrderStatus, userId: string): Promise<OrderView> {
    const order = await this.findRecord(id);
    try {
      assertCanTransition(order.status, next);
    } catch (error) {
      if (error instanceof InvalidOrderTransition) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }

    const updated = await this.prisma.serviceOrder.updateMany({
      where: { id, status: order.status },
      data: { status: next, assigneeId: order.assigneeId ?? userId },
    });
    if (updated.count !== 1) {
      throw new UnprocessableEntityException('A ordem mudou de status. Atualize e tente de novo.');
    }

    const view = toOrderView(await this.findRecord(id));
    this.gateway.emitUpdated(view);
    return view;
  }

  async addPhoto(id: string, file: UploadedImage | undefined): Promise<OrderView> {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Envie uma imagem JPEG, PNG ou WebP');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('A imagem deve ter no máximo 5 MB');
    }

    await this.findRecord(id);
    const extension = extname(file.originalname).toLowerCase() || '.bin';
    const key = `orders/${id}/${randomUUID()}${extension}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    await this.prisma.orderPhoto.create({
      data: {
        id: randomUUID(),
        orderId: id,
        objectKey: key,
        contentType: file.mimetype,
      },
    });

    const view = toOrderView(await this.findRecord(id));
    this.gateway.emitUpdated(view);
    return view;
  }

  async readPhoto(orderId: string, photoId: string) {
    const photo = await this.prisma.orderPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.orderId !== orderId) {
      throw new NotFoundException('Foto não encontrada');
    }
    return {
      contentType: photo.contentType,
      body: await this.storage.get(photo.objectKey),
    };
  }

  private async findRecord(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Ordem não encontrada');
    return order;
  }
}
