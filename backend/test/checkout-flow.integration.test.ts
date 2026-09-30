import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';
import { cleanupResources, createAndPayOrder, createFixture, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('jornada de checkout', () => {
  it('confirma o pagamento e impede a venda duplicada', async () => {
    const resource = createTestResources();
    resources.push(resource);
    await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Teste');
    const order = await createAndPayOrder(resource, customer.authorization);

    expect(order.total).toBe('40.00');
    expect(order.expiresAt).toEqual(expect.any(String));
    expect(new Date(order.expiresAt).getTime()).toBeGreaterThan(Date.now());
    await request(app).post('/orders').set('Authorization', customer.authorization).send({ sessionId: resource.sessionId, tickets: [{ seatId: resource.seatId, type: 'FULL' }] }).expect(400, { message: `O assento ${resource.seatId} já foi vendido` });
  });

  it('expira o hold e libera o assento', async () => {
    const resource = createTestResources();
    resources.push(resource);
    await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Expiração');
    const order = await request(app).post('/orders').set('Authorization', customer.authorization).send({ sessionId: resource.sessionId, tickets: [{ seatId: resource.seatId, type: 'FULL' }] }).expect(201);
    resource.orderIds.push(order.body.id);
    await db.orm.public.SeatHold.where({ orderId: order.body.id }).update({ expiresAt: new Date(Date.now() - 1_000).toISOString() });

    const seats = await request(app).get(`/sessions/${resource.sessionId}/seats`).expect(200);
    expect(seats.body[0].status).toBe('AVAILABLE');
    const expiredOrder = await request(app).get(`/orders/${order.body.id}`).set('Authorization', customer.authorization).expect(200);
    expect(expiredOrder.body.status).toBe('EXPIRED');
  });

  it('recusa reservas para sessões inativas ou já iniciadas', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const { session } = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Sessão Indisponível');

    await db.orm.public.Session.where({ id: session.id }).update({ isActive: false });
    await request(app).post('/orders').set('Authorization', customer.authorization).send({ sessionId: session.id, tickets: [{ seatId: resource.seatId, type: 'FULL' }] }).expect(400, { message: 'Esta sessão não está disponível para compra' });

    await db.orm.public.Session.where({ id: session.id }).update({ isActive: true, startsAt: new Date(Date.now() - 1_000).toISOString() });
    await request(app).post('/orders').set('Authorization', customer.authorization).send({ sessionId: session.id, tickets: [{ seatId: resource.seatId, type: 'FULL' }] }).expect(400, { message: 'Não é possível comprar ingressos para uma sessão já iniciada' });
  });
});
