import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

process.env.DATABASE_URL ??= 'postgresql://oficina:oficina@localhost:5432/oficina';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-value';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-value';
process.env.CORS_ORIGIN = 'http://localhost:3001';
process.env.S3_ENDPOINT = '';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'oficina-e2e-uploads');

const email = 'e2e.tecnico@oficina.local';
const password = 'oficina123';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('fluxo da ordem', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const passwordHash = await argon2.hash(password);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: 'tecnico', name: 'E2E Técnico' },
      create: {
        id: randomUUID(),
        email,
        name: 'E2E Técnico',
        role: 'tecnico',
        passwordHash,
      },
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('responde o healthcheck e rejeita senha errada', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'senha-errada' })
      .expect(401);
  });

  it('cria ordem, recusa transição inválida e aceita a válida', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    const token = login.body.accessToken as string;
    const auth = { Authorization: `Bearer ${token}` };

    const customerA = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Cliente A' })
      .expect(201);
    const customerB = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Cliente B' })
      .expect(201);
    const equipment = await request(app.getHttpServer())
      .post('/api/v1/equipment')
      .set(auth)
      .send({ customerId: customerA.body.id, brand: 'Brastemp', model: 'BWF11' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customerB.body.id,
        equipmentId: equipment.body.id,
        title: 'Ordem cruzada',
      })
      .expect(422);

    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customerA.body.id,
        equipmentId: equipment.body.id,
        title: 'Não centrifuga',
      })
      .expect(201);

    expect(created.body.status).toBe('aberto');

    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${created.body.id}/status`)
      .set(auth)
      .send({ status: 'entregue' })
      .expect(422);

    const moved = await request(app.getHttpServer())
      .patch(`/api/v1/orders/${created.body.id}/status`)
      .set(auth)
      .send({ status: 'em_diagnostico' })
      .expect(200);

    expect(moved.body.status).toBe('em_diagnostico');
    expect(moved.body.allowedTransitions).toEqual(['aguardando_peca', 'pronto']);
    expect(moved.body.assignee.email).toBeUndefined();
    expect(moved.body.assignee.name).toBe('E2E Técnico');
  });

  it('gira o refresh token e invalida o anterior', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    const first = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);

    expect(first.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('anexa uma foto e devolve os bytes', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };

    const customer = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Cliente Foto' })
      .expect(201);
    const equipment = await request(app.getHttpServer())
      .post('/api/v1/equipment')
      .set(auth)
      .send({ customerId: customer.body.id, brand: 'Consul', model: 'CWH12' })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.id,
        equipmentId: equipment.body.id,
        title: 'Foto do defeito',
      })
      .expect(201);

    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.body.id}/photos`)
      .set(auth)
      .attach('file', png, { filename: 'peca.png', contentType: 'image/png' })
      .expect(201);

    const photoId = uploaded.body.photos[0].id as string;
    const file = await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.body.id}/photos/${photoId}`)
      .set(auth)
      .expect(200);

    expect(file.headers['content-type']).toContain('image/png');
    expect(file.body.length).toBeGreaterThan(8);
  });
});
