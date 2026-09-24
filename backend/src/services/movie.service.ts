import { db } from '../prisma/db.js';

export async function listMovies() {
  return db.orm.public.Movie.all();
}
