import { Prisma } from '@prisma/client';
import { allowedTransitions, type OrderStatus } from './order-status';

export const orderInclude = {
  customer: true,
  equipment: true,
  assignee: true,
  photos: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ServiceOrderInclude;

export type OrderRecord = Prisma.ServiceOrderGetPayload<{ include: typeof orderInclude }>;

export type OrderView = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: OrderStatus;
  allowedTransitions: OrderStatus[];
  customer: { id: string; name: string; phone: string | null };
  equipment: { id: string; brand: string; model: string; serial: string | null };
  assignee: { id: string; name: string } | null;
  photos: { id: string; contentType: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
};

export function toOrderView(order: OrderRecord): OrderView {
  return {
    id: order.id,
    number: order.number,
    title: order.title,
    description: order.description,
    status: order.status,
    allowedTransitions: allowedTransitions(order.status),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone,
    },
    equipment: {
      id: order.equipment.id,
      brand: order.equipment.brand,
      model: order.equipment.model,
      serial: order.equipment.serial,
    },
    assignee: order.assignee ? { id: order.assignee.id, name: order.assignee.name } : null,
    photos: order.photos.map((photo) => ({
      id: photo.id,
      contentType: photo.contentType,
      createdAt: photo.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
