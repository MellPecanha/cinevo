import { db } from '../prisma/db.js';
import type { CreateMovieDTO } from '../dtos/movie.dto.js';

export async function listMovies() {
  return db.orm.public.Movie.all();
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
