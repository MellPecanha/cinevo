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

    await request(app).post('/tickets/validate').set('Authorization', `Bearer ${adminLogin.body.token as string}`).send({ code }).expect(200).expect((response) => {
      expect(response.body.status).toBe('USED');
      expect(response.body.usedAt).toBeTruthy();
    });
    await request(app).post('/tickets/validate').set('Authorization', `Bearer ${adminLogin.body.token as string}`).send({ code }).expect(400, { message: 'Ingresso já utilizado' });
    expect(order.id).toBeTruthy();
  });
});
