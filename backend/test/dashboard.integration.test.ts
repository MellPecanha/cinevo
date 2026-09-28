import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';
import { cleanupResources, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('dashboard administrativo', () => {
  it('restringe as métricas administrativas à plataforma', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const customer = await registerAndLogin(resource, 'Cliente Métricas');
    const platformAdmin = await registerAndLogin(resource, 'Admin Plataforma');

    await request(app).get('/admin/dashboard').set('Authorization', customer.authorization).expect(403, { message: 'Usuário não possui permissão para esta operação' });
    await db.orm.public.User.where({ id: platformAdmin.id }).update({ role: 'PLATFORM_ADMIN' });
    const adminLogin = await request(app).post('/auth/login').send({ email: platformAdmin.email, password: 'Teste#123' }).expect(200);

    await request(app).get('/admin/dashboard').set('Authorization', `Bearer ${adminLogin.body.token as string}`).expect(200).expect((response) => {
      expect(response.body).toMatchObject({
        cinemas: expect.any(Number), movies: expect.any(Number), paidOrders: expect.any(Number), activeTickets: expect.any(Number), revenue: expect.stringMatching(/^\d+\.\d{2}$/),
      });
    });
  });
});
