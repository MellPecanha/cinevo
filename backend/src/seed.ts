import 'dotenv/config';

import { hash } from 'bcrypt';

import { db } from './prisma/db.js';

const SEED_PASSWORD = 'Cinevo#123';

type SeedMovie = {
  title: string;
  description: string;
  duration: number;
  classification: 'L' | 'AGE_10' | 'AGE_12' | 'AGE_14' | 'AGE_16' | 'AGE_18';
};

const movies: SeedMovie[] = [
  {
    title: 'Depois do Horizonte',
    description: 'Uma piloto retorna à Terra para encontrar uma cidade que não reconhece mais.',
    duration: 138,
    classification: 'AGE_12',
  },
  {
    title: 'Cidade em Chamas',
    description: 'Uma investigação noturna coloca duas famílias no centro de uma escolha impossível.',
    duration: 116,
    classification: 'AGE_14',
  },
  {
    title: 'O Último Sinal',
    description: 'Mensagens de rádio atravessam décadas e mudam o rumo de uma pequena cidade.',
    duration: 124,
    classification: 'AGE_16',
  },
  {
    title: 'Maré Alta',
    description: 'Duas pessoas se reencontram quando uma ilha começa a desaparecer do mapa.',
    duration: 108,
    classification: 'AGE_12',
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

  return existing ?? db.orm.public.Session.create(data);
}

async function seed() {
  const [platformAdmin, cinemaAdmin, customer] = await Promise.all([
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
  ]);

  if (!platformAdmin || !cinemaAdmin || !customer) {
    throw new Error('Não foi possível criar os usuários de demonstração');
  }

  const [paulista, pinheiros] = await Promise.all([
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
  ]);

  const [standardRoom, vipRoom, pinheirosRoom] = await Promise.all([
    ensureRoom(paulista.id, 1, 'STANDARD'),
    ensureRoom(paulista.id, 2, 'VIP'),
    ensureRoom(pinheiros.id, 1, 'STANDARD'),
  ]);

  await Promise.all([
    ensureSeats(standardRoom.id, false),
    ensureSeats(vipRoom.id, true),
    ensureSeats(pinheirosRoom.id, false),
  ]);

  const seedMovies = await Promise.all(movies.map(ensureMovie));
  const sessionTimes = [
    futureSession(4, seedMovies[0].duration),
    futureSession(7, seedMovies[1].duration),
    futureSession(24, seedMovies[2].duration),
    futureSession(27, seedMovies[3].duration),
  ];

  await Promise.all([
    ensureSession({ movieId: seedMovies[0].id, roomId: standardRoom.id, price: '32.00', ...sessionTimes[0] }),
    ensureSession({ movieId: seedMovies[1].id, roomId: vipRoom.id, price: '46.00', ...sessionTimes[1] }),
    ensureSession({ movieId: seedMovies[2].id, roomId: pinheirosRoom.id, price: '29.00', ...sessionTimes[2] }),
    ensureSession({ movieId: seedMovies[3].id, roomId: standardRoom.id, price: '34.00', ...sessionTimes[3] }),
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
  console.log('Admin da plataforma: admin@cinevo.local / Cinevo#123');
  console.log('Admin do cinema: gerente@cinevo.local / Cinevo#123');
  console.log(`Recursos: 2 cinemas, 3 salas, ${seedMovies.length} filmes e 4 sessões.`);
  console.log(`Usuário de demonstração criado: ${customer.email}; admin: ${platformAdmin.email}.`);
}

seed().catch((error: unknown) => {
  console.error('Não foi possível executar a seed.', error);
  process.exitCode = 1;
});
