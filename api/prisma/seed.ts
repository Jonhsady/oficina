import { PrismaClient, type Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const EQUIPMENT_ID = '22222222-2222-4222-8222-222222222222';
const ORDER_OPEN_ID = '33333333-3333-4333-8333-333333333333';
const ORDER_DIAG_ID = '44444444-4444-4444-8444-444444444444';

async function upsertUser(name: string, email: string, role: Role) {
  const passwordHash = await argon2.hash('oficina123');
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { id: randomUUID(), name, email, role, passwordHash },
  });
}

async function main() {
  const technician = await upsertUser('Bruno Técnico', 'bruno.tecnico@oficina.local', 'tecnico');
  await upsertUser('Ana Admin', 'ana.admin@oficina.local', 'admin');

  await prisma.customer.upsert({
    where: { id: CUSTOMER_ID },
    update: { name: 'Marta Lopes', phone: '11999990000' },
    create: {
      id: CUSTOMER_ID,
      name: 'Marta Lopes',
      phone: '11999990000',
      email: 'marta@email.com',
    },
  });

  await prisma.equipment.upsert({
    where: { id: EQUIPMENT_ID },
    update: { brand: 'Electrolux', model: 'DF42', serial: 'ELX-DF42-1008' },
    create: {
      id: EQUIPMENT_ID,
      customerId: CUSTOMER_ID,
      brand: 'Electrolux',
      model: 'DF42',
      serial: 'ELX-DF42-1008',
    },
  });

  await prisma.serviceOrder.upsert({
    where: { id: ORDER_OPEN_ID },
    update: {},
    create: {
      id: ORDER_OPEN_ID,
      customerId: CUSTOMER_ID,
      equipmentId: EQUIPMENT_ID,
      title: 'Não gela a parte de baixo',
      description: 'Cliente relata que a geladeira só gela a parte superior.',
      status: 'aberto',
    },
  });

  await prisma.serviceOrder.upsert({
    where: { id: ORDER_DIAG_ID },
    update: {},
    create: {
      id: ORDER_DIAG_ID,
      customerId: CUSTOMER_ID,
      equipmentId: EQUIPMENT_ID,
      assigneeId: technician.id,
      title: 'Máquina de lavar não centrifuga',
      description: 'Barulho metálico no ciclo final.',
      status: 'em_diagnostico',
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
