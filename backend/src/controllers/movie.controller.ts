import type { Request, Response } from 'express';
import {
  createMovie,
  listMovies,
} from '../services/movie.service.js';

export async function getMovies(
  _req: Request,
  res: Response,
) {
  const movies = await listMovies();

  res.json(movies);
}

export async function postMovie(
  req: Request,
  res: Response,
) {
  const movie = await createMovie(req.body);

  res.status(201).json(movie);
}
