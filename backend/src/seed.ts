import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';

import { db } from './prisma/db.js';

const SEED_PASSWORD = 'Cinevo#123';

type SeedMovie = {
  title: string;
  description: string;
  duration: number;
  classification: 'L' | 'AGE_10' | 'AGE_12' | 'AGE_14' | 'AGE_16' | 'AGE_18';
  coverUrl: string;
};

const movies: SeedMovie[] = [
  {
    title: 'Depois do Horizonte',
    description: 'Uma piloto retorna à Terra para encontrar uma cidade que não reconhece mais.',
    duration: 138,
    classification: 'AGE_12',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Cidade em Chamas',
    description: 'Uma investigação noturna coloca duas famílias no centro de uma escolha impossível.',
    duration: 116,
    classification: 'AGE_14',
    coverUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e745c?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'O Último Sinal',
    description: 'Mensagens de rádio atravessam décadas e mudam o rumo de uma pequena cidade.',
    duration: 124,
    classification: 'AGE_16',
    coverUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Maré Alta',
    description: 'Duas pessoas se reencontram quando uma ilha começa a desaparecer do mapa.',
    duration: 108,
    classification: 'AGE_12',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Bosque de Vidro',
    description: 'Uma jovem descobre que as árvores de sua cidade guardam histórias vivas.',
    duration: 102,
    classification: 'L',
    coverUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Vértice do Amanhã',
    description: 'Em uma corrida contra o tempo, uma engenheira precisa escolher qual futuro salvar.',
    duration: 128,
    classification: 'AGE_12',
    coverUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85',
  },
];

function futureSession(hoursFromNow: number, durationMinutes: number) {
  const startsAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  startsAt.setMinutes(0, 0, 0);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + durationMinutes * 60 * 1000).toISOString(),
  };
}

async function ensureUser(data: {
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'CINEMA_ADMIN' | 'PLATFORM_ADMIN';
}) {
  const existing = await db.orm.public.User.where({ email: data.email }).first();

  if (existing) {
    return db.orm.public.User.where({ id: existing.id }).update({
      name: data.name,
      phone: data.phone,
      role: data.role,
    });
  }

  return db.orm.public.User.create({
    ...data,
    passwordHash: await hash(SEED_PASSWORD, 12),
  });
}

async function ensureCinema(data: {
  name: string;
  address: string;
  city: string;
  state: string;
}) {
  const existing = await db.orm.public.Cinema.where({ name: data.name }).first();

  return existing ?? db.orm.public.Cinema.create(data);
}

async function ensureRoom(cinemaId: number, number: number, type: 'STANDARD' | 'VIP') {
  const existing = await db.orm.public.Room.where({ cinemaId, number }).first();

  return existing ?? db.orm.public.Room.create({ cinemaId, number, type });
}

async function ensureSeats(roomId: number, isVip: boolean) {
  for (const row of ['A', 'B', 'C', 'D', 'E', 'F']) {
    for (let number = 1; number <= 8; number += 1) {
      const existing = await db.orm.public.Seat.where({ roomId, row, number }).first();

      if (!existing) {
        await db.orm.public.Seat.create({
          roomId,
          row,
          number,
          type: row === 'A' && number <= 2 ? 'ACCESSIBLE' : isVip ? 'VIP' : 'STANDARD',
        });
      }
    }
  }
}

async function ensureMovie(movie: SeedMovie) {
  const existing = await db.orm.public.Movie.where({ title: movie.title }).first();

  return existing ?? db.orm.public.Movie.create(movie);
}

async function ensureSession(data: {
  movieId: number;
  roomId: number;
  startsAt: string;
  endsAt: string;
  price: string;
}) {
  const existing = await db.orm.public.Session.where({
    movieId: data.movieId,
    roomId: data.roomId,
    startsAt: data.startsAt,
  }).first();

  if (existing) return existing;

  await db.orm.public.Session.create(data);

  const created = await db.orm.public.Session.where({
    movieId: data.movieId,
    roomId: data.roomId,
    startsAt: data.startsAt,
  }).first();

  if (!created) {
    throw new Error('Não foi possível criar a sessão de demonstração');
  }

  return created;
}

async function clearDatabaseBeforeSeed() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL deve estar configurada para executar a seed');
  }

  if (databaseUrl.includes('cinevo_test')) {
    throw new Error('A seed não pode apagar o banco de testes');
  }

  await db.transaction(async (tx) => {
    for (const ticket of await tx.orm.public.Ticket.all()) {
      await tx.orm.public.Ticket.where({ id: ticket.id }).delete();
    }

    for (const hold of await tx.orm.public.SeatHold.all()) {
      await tx.orm.public.SeatHold.where({ id: hold.id }).delete();
    }

    for (const favorite of await tx.orm.public.Favorite.all()) {
      await tx.orm.public.Favorite.where({ userId: favorite.userId, movieId: favorite.movieId }).delete();
    }

    for (const assignment of await tx.orm.public.CinemaAdmin.all()) {
      await tx.orm.public.CinemaAdmin.where({ cinemaId: assignment.cinemaId, userId: assignment.userId }).delete();
    }

    for (const order of await tx.orm.public.Order.all()) {
      await tx.orm.public.Order.where({ id: order.id }).delete();
    }

    for (const session of await tx.orm.public.Session.all()) {
      await tx.orm.public.Session.where({ id: session.id }).delete();
    }

    for (const seat of await tx.orm.public.Seat.all()) {
      await tx.orm.public.Seat.where({ id: seat.id }).delete();
    }

    for (const room of await tx.orm.public.Room.all()) {
      await tx.orm.public.Room.where({ id: room.id }).delete();
    }

    for (const movie of await tx.orm.public.Movie.all()) {
      await tx.orm.public.Movie.where({ id: movie.id }).delete();
    }

    for (const cinema of await tx.orm.public.Cinema.all()) {
      await tx.orm.public.Cinema.where({ id: cinema.id }).delete();
    }

    for (const user of await tx.orm.public.User.all()) {
      await tx.orm.public.User.where({ id: user.id }).delete();
    }
  });
}

async function createDemoPaidOrder(data: {
  userId: number;
  sessionId: number;
  seatId: number;
  price: string;
}) {
  await db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.create({
      userId: data.userId,
      status: 'PAID',
      total: data.price,
    });

    await tx.orm.public.Ticket.create({
      orderId: order.id,
      sessionId: data.sessionId,
      seatId: data.seatId,
      type: 'FULL',
      price: data.price,
      code: `DEMO-${randomUUID()}`,
      status: 'ACTIVE',
    });
  });
}

async function seed() {
  await clearDatabaseBeforeSeed();

  const [platformAdmin, cinemaAdmin, customer, secondCustomer] = await Promise.all([
    ensureUser({
      name: 'Admin Cinevo',
      email: 'admin@cinevo.local',
      role: 'PLATFORM_ADMIN',
    }),
    ensureUser({
      name: 'Gerente Paulista',
      email: 'gerente@cinevo.local',
      role: 'CINEMA_ADMIN',
    }),
    ensureUser({
      name: 'Cliente Demonstração',
      email: 'cliente@cinevo.local',
      phone: '11999990000',
      role: 'CUSTOMER',
    }),
    ensureUser({
      name: 'Marina Souza',
      email: 'marina@cinevo.local',
      phone: '11988887777',
      role: 'CUSTOMER',
    }),
  ]);

  if (!platformAdmin || !cinemaAdmin || !customer || !secondCustomer) {
    throw new Error('Não foi possível criar os usuários de demonstração');
  }

  const [paulista, pinheiros, moema, copacabana, botafogo, savassi, batel, boaViagem] = await Promise.all([
    ensureCinema({
      name: 'Cinevo Paulista',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
    }),
    ensureCinema({
      name: 'Cinevo Pinheiros',
      address: 'Rua dos Pinheiros, 480',
      city: 'São Paulo',
      state: 'SP',
    }),
    ensureCinema({
      name: 'Cinevo Moema',
      address: 'Av. Ibirapuera, 2100',
      city: 'São Paulo',
      state: 'SP',
    }),
    ensureCinema({
      name: 'Cinevo Copacabana',
      address: 'Av. Nossa Senhora de Copacabana, 680',
      city: 'Rio de Janeiro',
      state: 'RJ',
    }),
    ensureCinema({
      name: 'Cinevo Botafogo',
      address: 'Rua Voluntários da Pátria, 120',
      city: 'Rio de Janeiro',
      state: 'RJ',
    }),
    ensureCinema({ name: 'Cinevo Savassi', address: 'Rua Pernambuco, 1200', city: 'Belo Horizonte', state: 'MG' }),
    ensureCinema({ name: 'Cinevo Batel', address: 'Av. do Batel, 1868', city: 'Curitiba', state: 'PR' }),
    ensureCinema({ name: 'Cinevo Boa Viagem', address: 'Av. Boa Viagem, 1530', city: 'Recife', state: 'PE' }),
  ]);

  const [standardRoom, vipRoom, pinheirosRoom, moemaRoom, copacabanaRoom, botafogoRoom, savassiRoom, batelRoom, boaViagemRoom] = await Promise.all([
    ensureRoom(paulista.id, 1, 'STANDARD'),
    ensureRoom(paulista.id, 2, 'VIP'),
    ensureRoom(pinheiros.id, 1, 'STANDARD'),
    ensureRoom(moema.id, 3, 'VIP'),
    ensureRoom(copacabana.id, 1, 'STANDARD'),
    ensureRoom(botafogo.id, 2, 'STANDARD'),
    ensureRoom(savassi.id, 1, 'STANDARD'),
    ensureRoom(batel.id, 1, 'VIP'),
    ensureRoom(boaViagem.id, 1, 'STANDARD'),
  ]);

  await Promise.all([
    ensureSeats(standardRoom.id, false),
    ensureSeats(vipRoom.id, true),
    ensureSeats(pinheirosRoom.id, false),
    ensureSeats(moemaRoom.id, true),
    ensureSeats(copacabanaRoom.id, false),
    ensureSeats(botafogoRoom.id, false),
    ensureSeats(savassiRoom.id, false),
    ensureSeats(batelRoom.id, true),
    ensureSeats(boaViagemRoom.id, false),
  ]);

  const seedMovies = await Promise.all(movies.map(ensureMovie));
  const rooms = [standardRoom, vipRoom, pinheirosRoom, moemaRoom, copacabanaRoom, botafogoRoom, savassiRoom, batelRoom, boaViagemRoom];
  const prices = ['32.00', '46.00', '29.00', '34.00'];
  const sessionPlans = Array.from({ length: 7 }, (_, day) => [0, 1, 2, 3].map((movieIndex) => ({
    movieIndex,
    room: rooms[(day * 4 + movieIndex) % rooms.length],
    price: prices[movieIndex],
    // A primeira programação começa nas próximas horas e continua por sete dias.
    times: futureSession(3 + day * 24 + movieIndex * 3, seedMovies[movieIndex].duration),
  }))).flat();

  const seededSessions = await Promise.all(sessionPlans.map((plan) => ensureSession({
    movieId: seedMovies[plan.movieIndex].id,
    roomId: plan.room.id,
    price: plan.price,
    ...plan.times,
  })));

  const paulistaSeats = await db.orm.public.Seat
    .where({ roomId: standardRoom.id })
    .all();

  const firstDemoSeat = paulistaSeats.find((seat) => seat.row === 'B' && seat.number === 1);
  const secondDemoSeat = paulistaSeats.find((seat) => seat.row === 'B' && seat.number === 2);

  if (!firstDemoSeat || !secondDemoSeat) {
    throw new Error('Não foi possível preparar assentos para as vendas de demonstração');
  }

  await Promise.all([
    createDemoPaidOrder({ userId: customer.id, sessionId: seededSessions[0].id, seatId: firstDemoSeat.id, price: '32.00' }),
    createDemoPaidOrder({ userId: secondCustomer.id, sessionId: seededSessions[0].id, seatId: secondDemoSeat.id, price: '32.00' }),
  ]);

  const existingAssignment = await db.orm.public.CinemaAdmin.where({
    cinemaId: paulista.id,
    userId: cinemaAdmin.id,
  }).first();

  if (!existingAssignment) {
    await db.orm.public.CinemaAdmin.create({
      cinemaId: paulista.id,
      userId: cinemaAdmin.id,
    });
  }

  console.log('Seed concluída.');
  console.log('Cliente: cliente@cinevo.local / Cinevo#123');
  console.log('Cliente adicional: marina@cinevo.local / Cinevo#123');
  console.log('Admin da plataforma: admin@cinevo.local / Cinevo#123');
  console.log('Admin do cinema: gerente@cinevo.local / Cinevo#123');
  console.log(`Recursos: 8 cinemas em 5 cidades, 9 salas, ${seedMovies.length} filmes, ${seededSessions.length} sessões e 2 ingressos pagos.`);
  console.log(`Usuário de demonstração criado: ${customer.email}; admin: ${platformAdmin.email}.`);
}

seed().catch((error: unknown) => {
  console.error('Não foi possível executar a seed.', error);
  process.exitCode = 1;
});
