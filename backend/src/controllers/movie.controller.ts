import type { Request, Response } from 'express';
import {
  createMovie,
  deactivateMovie,
  listMovies,
  updateMovie,
} from '../services/movie.service.js';

export async function getMovies(
  _req: Request,
  res: Response,
) {
  const movies = await listMovies();

  res.json(movies);
}

export async function patchDeactivateMovie(req: Request, res: Response) {
  const movieId = Number(req.params.id);

  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    res.status(400).json({ message: 'Filme inválido' });
    return;
  }

  try {
    res.json(await deactivateMovie(movieId));
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Filme não encontrado' });
  }
}

export async function postMovie(
  req: Request,
  res: Response,
) {
  const movie = await createMovie(req.body);

  res.status(201).json(movie);
}

export async function patchMovie(req: Request, res: Response) {
  const movieId = Number(req.params.id);

  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    res.status(400).json({ message: 'Filme inválido' });
    return;
  }

  try {
    res.json(await updateMovie(movieId, req.body));
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Filme não encontrado' });
  }
}
