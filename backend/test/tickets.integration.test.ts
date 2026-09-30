import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';
import { cleanupResources, createAndPayOrder, createFixture, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('ingressos', () => {
  it('permite uma única validação por administrador do cinema', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const { cinema } = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente QR');
    const cinemaAdmin = await registerAndLogin(resource, 'Administrador Cinema');
    resource.cinemaAdminUserId = cinemaAdmin.id;

    await db.orm.public.User.where({ id: cinemaAdmin.id }).update({ role: 'CINEMA_ADMIN' });
    await db.orm.public.CinemaAdmin.create({ cinemaId: cinema.id, userId: cinemaAdmin.id });
    const adminLogin = await request(app).post('/auth/login').send({ email: cinemaAdmin.email, password: 'Teste#123' }).expect(200);
    const order = await createAndPayOrder(resource, customer.authorization);
    const tickets = await request(app).get('/tickets').set('Authorization', customer.authorization).expect(200);
    const code = tickets.body[0].code as string;

    await request(app)
      .get(`/admin/cinemas/${cinema.id}/tickets`)
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].buyer.email).toBe(customer.email);
        expect(response.body[0].seat).toEqual({ row: 'A', number: 1 });
        expect(response.body[0].status).toBe('ACTIVE');
      });

    await request(app)
      .get(`/admin/cinemas/${cinema.id}/metrics`)
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({ ticketsSold: 1, activeTickets: 1, revenue: '40.00' });
      });

    await request(app).post('/tickets/validate').set('Authorization', `Bearer ${adminLogin.body.token as string}`).send({ code }).expect(200).expect((response) => {
      expect(response.body.status).toBe('USED');
      expect(response.body.usedAt).toBeTruthy();
    });
    await request(app).post('/tickets/validate').set('Authorization', `Bearer ${adminLogin.body.token as string}`).send({ code }).expect(400, { message: 'Ingresso já utilizado' });
    expect(order.id).toBeTruthy();
  });

  it('cancela uma sessão e preserva o histórico como ingressos cancelados', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const { cinema, session } = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente sessão cancelada');
    const cinemaAdmin = await registerAndLogin(resource, 'Gerente sessão cancelada');
    resource.cinemaAdminUserId = cinemaAdmin.id;

    await db.orm.public.User.where({ id: cinemaAdmin.id }).update({ role: 'CINEMA_ADMIN' });
    await db.orm.public.CinemaAdmin.create({ cinemaId: cinema.id, userId: cinemaAdmin.id });
    const adminLogin = await request(app).post('/auth/login').send({ email: cinemaAdmin.email, password: 'Teste#123' }).expect(200);
    await createAndPayOrder(resource, customer.authorization);

    await request(app)
      .patch(`/sessions/${session.id}/cancel`)
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .expect(200, { cancelledTickets: 1, affectedOrders: 1 });

    await request(app)
      .get('/tickets')
      .set('Authorization', customer.authorization)
      .expect(200)
      .expect((response) => expect(response.body[0].status).toBe('CANCELLED'));
  });

  it('cancela reservas pendentes ao cancelar uma sessão', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const { cinema, session } = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Reserva Pendente');
    const cinemaAdmin = await registerAndLogin(resource, 'Gerente Reserva Pendente');
    resource.cinemaAdminUserId = cinemaAdmin.id;

    await db.orm.public.User.where({ id: cinemaAdmin.id }).update({ role: 'CINEMA_ADMIN' });
    await db.orm.public.CinemaAdmin.create({ cinemaId: cinema.id, userId: cinemaAdmin.id });
    const adminLogin = await request(app).post('/auth/login').send({ email: cinemaAdmin.email, password: 'Teste#123' }).expect(200);
    const order = await request(app).post('/orders').set('Authorization', customer.authorization).send({ sessionId: session.id, tickets: [{ seatId: resource.seatId, type: 'FULL' }] }).expect(201);
    resource.orderIds.push(order.body.id);

    await request(app).patch(`/sessions/${session.id}/cancel`).set('Authorization', `Bearer ${adminLogin.body.token as string}`).expect(200);
    const cancelledOrder = await request(app).get(`/orders/${order.body.id}`).set('Authorization', customer.authorization).expect(200);
    expect(cancelledOrder.body.status).toBe('CANCELLED');
    expect(await db.orm.public.SeatHold.where({ orderId: order.body.id }).all()).toHaveLength(0);
  });
});
