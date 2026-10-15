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

  it('permite ao usuário editar o próprio perfil e trocar a senha com confirmação', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const customer = await registerAndLogin(resource, 'Perfil original');

    await request(app).patch('/users/me').set('Authorization', customer.authorization).send({
      name: 'Perfil atualizado', email: 'perfil.atualizado@cinevo.test', phone: '11988887777',
      currentPassword: 'Teste#123', password: 'NovaSenha#123',
    }).expect(200).expect((response) => {
      expect(response.body).toMatchObject({ name: 'Perfil atualizado', email: 'perfil.atualizado@cinevo.test', phone: '11988887777' });
      expect(response.body.passwordHash).toBeUndefined();
    });

    await request(app).post('/auth/login').send({ email: 'perfil.atualizado@cinevo.test', password: 'NovaSenha#123' }).expect(200);
  });

  it('recusa troca de senha com a senha atual incorreta', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const customer = await registerAndLogin(resource, 'Senha protegida');

    await request(app).patch('/users/me').set('Authorization', customer.authorization).send({
      name: 'Senha protegida', email: customer.email, phone: '11999999999',
      currentPassword: 'Incorreta#123', password: 'NovaSenha#123',
    }).expect(401, { message: 'Senha atual inválida' });
  });
});
