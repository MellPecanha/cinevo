import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';
import { cleanupResources, createFixture, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('edição administrativa', () => {
  it('permite que um administrador da plataforma atualize filme e cinema', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const fixture = await createFixture(resource);
    const administrator = await registerAndLogin(resource, 'Admin de edição');
    await db.orm.public.User.where({ id: administrator.id }).update({ role: 'PLATFORM_ADMIN' });
    const login = await request(app).post('/auth/login').send({ email: administrator.email, password: 'Teste#123' }).expect(200);
    const authorization = `Bearer ${login.body.token as string}`;

    await request(app).patch(`/movies/${fixture.movie.id}`).set('Authorization', authorization).send({
      title: 'Filme revisado', description: 'Nova sinopse', duration: 95, classification: 'AGE_14', coverUrl: 'https://example.com/capa.jpg', trailerUrl: 'https://example.com/trailer',
    }).expect(200).expect((response) => {
      expect(response.body).toMatchObject({ title: 'Filme revisado', duration: 95, classification: 'AGE_14' });
    });

    await request(app).patch(`/cinemas/${fixture.cinema.id}`).set('Authorization', authorization).send({
      name: 'Cinevo Centro', address: 'Avenida Central, 99', city: 'Campinas', state: 'sp',
    }).expect(200).expect((response) => {
      expect(response.body).toMatchObject({ name: 'Cinevo Centro', city: 'Campinas', state: 'SP' });
    });
  });

  it('restringe a edição ao administrador da plataforma', async () => {
    const resource = createTestResources();
    resources.push(resource);
    const fixture = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente sem acesso');

    await request(app).patch(`/movies/${fixture.movie.id}`).set('Authorization', customer.authorization).send({
      title: 'Tentativa', duration: 95, classification: 'AGE_14',
    }).expect(403, { message: 'Usuário não possui permissão para esta operação' });
  });
});
