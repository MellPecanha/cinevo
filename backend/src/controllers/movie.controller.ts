import type { Request, Response } from 'express';
import { listMovies } from '../services/movie.service.js';

export async function getMovies(
  _req: Request,
  res: Response,
) {
  const movies = await listMovies();

  res.json(movies);
}
