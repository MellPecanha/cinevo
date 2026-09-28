import { randomUUID } from 'node:crypto';

import request from 'supertest';

import { app } from '../../src/app.js';
import { db } from '../../src/prisma/db.js';

export type TestResources = {
  cinemaId?: number;
  movieId?: number;
  roomId?: number;
  sessionId?: number;
  seatId?: number;
  userIds: number[];
  orderIds: number[];
  cinemaAdminUserId?: number;
};

export function createTestResources(): TestResources {
  return { userIds: [], orderIds: [] };
}

export async function createFixture(resources: TestResources) {
  const suffix = randomUUID();
  const cinema = await db.orm.public.Cinema.create({ name: `Cinema Test ${suffix}`, address: 'Rua de Teste, 1', city: 'São Paulo', state: 'SP' });
  const movie = await db.orm.public.Movie.create({ title: `Filme Test ${suffix}`, duration: 120, classification: 'AGE_12' });
  const room = await db.orm.public.Room.create({ cinemaId: cinema.id, number: 1, type: 'STANDARD' });
  const seat = await db.orm.public.Seat.create({ roomId: room.id, row: 'A', number: 1, type: 'STANDARD' });
  const startsAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const session = await db.orm.public.Session.create({
    movieId: movie.id,
    roomId: room.id,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    price: '40.00',
  });

  Object.assign(resources, { cinemaId: cinema.id, movieId: movie.id, roomId: room.id, sessionId: session.id, seatId: seat.id });

  return { cinema, movie, room, seat, session };
}

export async function registerAndLogin(resources: TestResources, name: string) {
  const suffix = randomUUID();
  const email = `${suffix}@cinevo.test`;
  const password = 'Teste#123';
  const registration = await request(app).post('/users').send({ name, email, phone: '11999999999', password }).expect(201);
  resources.userIds.push(registration.body.id);
  const login = await request(app).post('/auth/login').send({ email, password }).expect(200);

  return { id: registration.body.id as number, email, authorization: `Bearer ${login.body.token as string}` };
}

export async function createAndPayOrder(resources: TestResources, authorization: string) {
  const order = await request(app).post('/orders').set('Authorization', authorization).send({
    sessionId: resources.sessionId,
    tickets: [{ seatId: resources.seatId, type: 'FULL' }],
  }).expect(201);

  resources.orderIds.push(order.body.id);
  await request(app).post(`/orders/${order.body.id}/pay`).set('Authorization', authorization).expect(200);
  return order.body;
}

export async function cleanupResources(resources: TestResources[]) {
  for (const resource of resources.splice(0)) {
    for (const orderId of resource.orderIds) {
      await db.orm.public.Ticket.where({ orderId }).delete();
      await db.orm.public.SeatHold.where({ orderId }).delete();
      await db.orm.public.Order.where({ id: orderId }).delete();
    }

    if (resource.cinemaId && resource.cinemaAdminUserId) await db.orm.public.CinemaAdmin.where({ cinemaId: resource.cinemaId, userId: resource.cinemaAdminUserId }).delete();
    if (resource.sessionId) await db.orm.public.Session.where({ id: resource.sessionId }).delete();
    if (resource.seatId) await db.orm.public.Seat.where({ id: resource.seatId }).delete();
    if (resource.roomId) await db.orm.public.Room.where({ id: resource.roomId }).delete();
    if (resource.movieId) {
      await db.orm.public.Favorite.where({ movieId: resource.movieId }).delete();
      await db.orm.public.Movie.where({ id: resource.movieId }).delete();
    }
    if (resource.cinemaId) await db.orm.public.Cinema.where({ id: resource.cinemaId }).delete();
    for (const userId of resource.userIds) await db.orm.public.User.where({ id: userId }).delete();
  }
}
