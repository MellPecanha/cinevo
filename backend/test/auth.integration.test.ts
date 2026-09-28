import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { cleanupResources, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('autenticação', () => {
  it('retorna erro JSON para credenciais inválidas', async () => {
    await request(app).post('/auth/login').send({ email: 'inexistente@cinevo.test', password: 'SenhaInexistente' }).expect(401, { message: 'E-mail ou senha inválidos' });
  });

  it('retorna somente os dados seguros do usuário autenticado', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const customer = await registerAndLogin(resource, 'Perfil Seguro');

    await request(app).get('/auth/me').set('Authorization', customer.authorization).expect(200).expect((response) => {
      expect(response.body).toMatchObject({ id: customer.id, name: 'Perfil Seguro', role: 'CUSTOMER' });
      expect(response.body.passwordHash).toBeUndefined();
    });
  });
});
