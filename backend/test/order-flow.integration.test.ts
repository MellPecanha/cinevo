import { randomUUID } from 'node:crypto';

import request from 'supertest';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';

type Resources = {
  cinemaId?: number;
  movieId?: number;
  roomId?: number;
  sessionId?: number;
  seatId?: number;
  userIds: number[];
  orderIds: number[];
  cinemaAdminUserId?: number;
};

const resources: Resources[] = [];

function createResources(): Resources {
  const value: Resources = {
    userIds: [],
    orderIds: [],
  };

  resources.push(value);

  return value;
}

async function createFixture(resources: Resources) {
  const suffix = randomUUID();

  const cinema = await db.orm.public.Cinema.create({
    name: `Cinema Test ${suffix}`,
    address: 'Rua de Teste, 1',
    city: 'São Paulo',
    state: 'SP',
  });

  const movie = await db.orm.public.Movie.create({
    title: `Filme Test ${suffix}`,
    duration: 120,
    classification: 'AGE_12',
  });

  const room = await db.orm.public.Room.create({
    cinemaId: cinema.id,
    number: 1,
    type: 'STANDARD',
  });

  const seat = await db.orm.public.Seat.create({
    roomId: room.id,
    row: 'A',
    number: 1,
    type: 'STANDARD',
  });

  const startsAt = new Date(
    Date.now() + 4 * 60 * 60 * 1000,
  );

  const session = await db.orm.public.Session.create({
    movieId: movie.id,
    roomId: room.id,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(
      startsAt.getTime() + 2 * 60 * 60 * 1000,
    ).toISOString(),
    price: '40.00',
  });

  resources.cinemaId = cinema.id;
  resources.movieId = movie.id;
  resources.roomId = room.id;
  resources.sessionId = session.id;
  resources.seatId = seat.id;

  return {
    cinema,
    room,
    seat,
    session,
  };
}

async function registerAndLogin(
  resources: Resources,
  name: string,
) {
  const suffix = randomUUID();
  const email = `${suffix}@cinevo.test`;
  const password = 'Teste#123';

  const registration = await request(app)
    .post('/users')
    .send({
      name,
      email,
      phone: '11999999999',
      password,
    })
    .expect(201);

  resources.userIds.push(registration.body.id);

  const login = await request(app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    id: registration.body.id as number,
    email,
    authorization: `Bearer ${login.body.token as string}`,
  };
}

async function createAndPayOrder(
  resources: Resources,
  authorization: string,
) {
  const order = await request(app)
    .post('/orders')
    .set('Authorization', authorization)
    .send({
      sessionId: resources.sessionId,
      tickets: [
        {
          seatId: resources.seatId,
          type: 'FULL',
        },
      ],
    })
    .expect(201);

  resources.orderIds.push(order.body.id);

  await request(app)
    .post(`/orders/${order.body.id}/pay`)
    .set('Authorization', authorization)
    .expect(200);

  return order.body;
}

afterEach(async () => {
  const values = resources.splice(0);

  for (const resource of values) {
    for (const orderId of resource.orderIds) {
      await db.orm.public.Ticket.where({ orderId }).delete();
      await db.orm.public.SeatHold.where({ orderId }).delete();
      await db.orm.public.Order.where({ id: orderId }).delete();
    }

    if (resource.cinemaId && resource.cinemaAdminUserId) {
      await db.orm.public.CinemaAdmin
        .where({
          cinemaId: resource.cinemaId,
          userId: resource.cinemaAdminUserId,
        })
        .delete();
    }

    if (resource.sessionId) {
      await db.orm.public.Session
        .where({ id: resource.sessionId })
        .delete();
    }

    if (resource.seatId) {
      await db.orm.public.Seat
        .where({ id: resource.seatId })
        .delete();
    }

    if (resource.roomId) {
      await db.orm.public.Room
        .where({ id: resource.roomId })
        .delete();
    }

    if (resource.movieId) {
      await db.orm.public.Favorite
        .where({ movieId: resource.movieId })
        .delete();

      await db.orm.public.Movie
        .where({ id: resource.movieId })
        .delete();
    }

    if (resource.cinemaId) {
      await db.orm.public.Cinema
        .where({ id: resource.cinemaId })
        .delete();
    }

    for (const userId of resource.userIds) {
      await db.orm.public.User.where({ id: userId }).delete();
    }
  }
});

describe('fluxos críticos de compra', () => {
  it('restringe as métricas administrativas à plataforma', async () => {
    const resource = createResources();
    const customer = await registerAndLogin(resource, 'Cliente Métricas');
    const platformAdmin = await registerAndLogin(
      resource,
      'Admin Plataforma',
    );

    await request(app)
      .get('/admin/dashboard')
      .set('Authorization', customer.authorization)
      .expect(403, {
        message: 'Usuário não possui permissão para esta operação',
      });

    await db.orm.public.User
      .where({ id: platformAdmin.id })
      .update({ role: 'PLATFORM_ADMIN' });

    const adminLogin = await request(app)
      .post('/auth/login')
      .send({
        email: platformAdmin.email,
        password: 'Teste#123',
      })
      .expect(200);

    await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          cinemas: expect.any(Number),
          movies: expect.any(Number),
          paidOrders: expect.any(Number),
          activeTickets: expect.any(Number),
          revenue: expect.stringMatching(/^\d+\.\d{2}$/),
        });
      });
  });

  it('retorna erro JSON para credenciais inválidas', async () => {
    await request(app)
      .post('/auth/login')
      .send({
        email: 'inexistente@cinevo.test',
        password: 'SenhaInexistente',
      })
      .expect(401, {
        message: 'E-mail ou senha inválidos',
      });
  });

  it('retorna somente os dados seguros do usuário autenticado', async () => {
    const resource = createResources();
    const customer = await registerAndLogin(resource, 'Perfil Seguro');

    await request(app)
      .get('/auth/me')
      .set('Authorization', customer.authorization)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: customer.id,
          name: 'Perfil Seguro',
          role: 'CUSTOMER',
        });
        expect(response.body.passwordHash).toBeUndefined();
      });
  });

  it('mantém favoritos isolados por cliente', async () => {
    const resource = createResources();
    await createFixture(resource);
    const firstCustomer = await registerAndLogin(
      resource,
      'Cliente Favorito',
    );
    const secondCustomer = await registerAndLogin(
      resource,
      'Outro Cliente',
    );

    await request(app)
      .post(`/favorites/${resource.movieId}`)
      .set('Authorization', firstCustomer.authorization)
      .expect(201);

    await request(app)
      .get('/favorites')
      .set('Authorization', firstCustomer.authorization)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].movieId).toBe(resource.movieId);
      });

    await request(app)
      .get('/favorites')
      .set('Authorization', secondCustomer.authorization)
      .expect(200, []);

    await request(app)
      .delete(`/favorites/${resource.movieId}`)
      .set('Authorization', firstCustomer.authorization)
      .expect(204);

    await request(app)
      .get('/favorites')
      .set('Authorization', firstCustomer.authorization)
      .expect(200, []);
  });

  it('confirma o pagamento e impede a venda duplicada', async () => {
    const resource = createResources();
    await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Teste');

    const order = await createAndPayOrder(
      resource,
      customer.authorization,
    );

    expect(order.total).toBe('40.00');
    expect(order.expiresAt).toEqual(expect.any(String));
    expect(new Date(order.expiresAt).getTime()).toBeGreaterThan(Date.now());

    await request(app)
      .post('/orders')
      .set('Authorization', customer.authorization)
      .send({
        sessionId: resource.sessionId,
        tickets: [
          {
            seatId: resource.seatId,
            type: 'FULL',
          },
        ],
      })
      .expect(400, {
        message: `O assento ${resource.seatId} já foi vendido`,
      });
  });

  it('expira o hold e libera o assento', async () => {
    const resource = createResources();
    await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente Expiração');

    const order = await request(app)
      .post('/orders')
      .set('Authorization', customer.authorization)
      .send({
        sessionId: resource.sessionId,
        tickets: [
          {
            seatId: resource.seatId,
            type: 'FULL',
          },
        ],
      })
      .expect(201);

    resource.orderIds.push(order.body.id);

    await db.orm.public.SeatHold
      .where({ orderId: order.body.id })
      .update({
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      });

    const seats = await request(app)
      .get(`/sessions/${resource.sessionId}/seats`)
      .expect(200);

    expect(seats.body[0].status).toBe('AVAILABLE');

    const expiredOrder = await request(app)
      .get(`/orders/${order.body.id}`)
      .set('Authorization', customer.authorization)
      .expect(200);

    expect(expiredOrder.body.status).toBe('EXPIRED');
  });

  it('permite uma única validação por administrador do cinema', async () => {
    const resource = createResources();
    const { cinema } = await createFixture(resource);
    const customer = await registerAndLogin(resource, 'Cliente QR');
    const cinemaAdmin = await registerAndLogin(
      resource,
      'Administrador Cinema',
    );

    resource.cinemaAdminUserId = cinemaAdmin.id;

    await db.orm.public.User
      .where({ id: cinemaAdmin.id })
      .update({ role: 'CINEMA_ADMIN' });

    await db.orm.public.CinemaAdmin.create({
      cinemaId: cinema.id,
      userId: cinemaAdmin.id,
    });

    const adminLogin = await request(app)
      .post('/auth/login')
      .send({
        email: (
          await db.orm.public.User
            .where({ id: cinemaAdmin.id })
            .first()
        )?.email,
        password: 'Teste#123',
      })
      .expect(200);

    const order = await createAndPayOrder(
      resource,
      customer.authorization,
    );

    const tickets = await request(app)
      .get('/tickets')
      .set('Authorization', customer.authorization)
      .expect(200);

    const code = tickets.body[0].code as string;

    await request(app)
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .send({ code })
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('USED');
        expect(response.body.usedAt).toBeTruthy();
      });

    await request(app)
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminLogin.body.token as string}`)
      .send({ code })
      .expect(400, {
        message: 'Ingresso já utilizado',
      });

    expect(order.id).toBeTruthy();
  });
});
