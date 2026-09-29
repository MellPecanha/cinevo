import { db } from '../prisma/db.js';
import type { CreateMovieDTO } from '../dtos/movie.dto.js';

export async function listMovies() {
  return db.orm.public.Movie.where({ isActive: true }).all();
}

export async function deactivateMovie(movieId: number) {
  const movie = await db.orm.public.Movie.where({ id: movieId }).first();

  if (!movie) throw new Error('Filme não encontrado');

  return db.orm.public.Movie.where({ id: movieId }).update({ isActive: false });
}

export async function createMovie(data: CreateMovieDTO) {
  return db.orm.public.Movie.create({
    title: data.title,
    description: data.description,
    duration: data.duration,
    classification: data.classification,
    coverUrl: data.coverUrl,
    trailerUrl: data.trailerUrl,
  });
}
