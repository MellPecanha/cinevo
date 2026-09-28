import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { cleanupResources, createFixture, createTestResources, registerAndLogin, type TestResources } from './helpers/fixtures.js';

const resources: TestResources[] = [];
afterEach(() => cleanupResources(resources));

describe('favoritos', () => {
  it('mantém favoritos isolados por cliente', async () => {
    const resource = createTestResources();
    resources.push(resource);
    await createFixture(resource);
    const firstCustomer = await registerAndLogin(resource, 'Cliente Favorito');
    const secondCustomer = await registerAndLogin(resource, 'Outro Cliente');

    await request(app).post(`/favorites/${resource.movieId}`).set('Authorization', firstCustomer.authorization).expect(201);
    await request(app).get('/favorites').set('Authorization', firstCustomer.authorization).expect(200).expect((response) => {
      expect(response.body).toHaveLength(1);
      expect(response.body[0].movieId).toBe(resource.movieId);
    });
    await request(app).get('/favorites').set('Authorization', secondCustomer.authorization).expect(200, []);
    await request(app).delete(`/favorites/${resource.movieId}`).set('Authorization', firstCustomer.authorization).expect(204);
    await request(app).get('/favorites').set('Authorization', firstCustomer.authorization).expect(200, []);
  });
});
