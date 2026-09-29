import { db } from '../prisma/db.js';
import type { CreateCinemaDTO } from '../dtos/cinema.dto.js';

export async function listCinemas() {
  return db.orm.public.Cinema.all();
}

export async function createCinema(data: CreateCinemaDTO) {
  return db.orm.public.Cinema.create({
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
  });
}

export async function listManageableCinemas(
  userId: number,
  role: 'CINEMA_ADMIN' | 'PLATFORM_ADMIN',
) {
  if (role === 'PLATFORM_ADMIN') return listCinemas();

  const assignments = await db.orm.public.CinemaAdmin
    .include('cinema')
    .where({ userId })
    .all();

  return assignments.map((assignment) => assignment.cinema);
}
