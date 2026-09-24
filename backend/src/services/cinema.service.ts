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
