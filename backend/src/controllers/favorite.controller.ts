import type { Request, Response } from 'express';

import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from '../services/favorite.service.js';

function getMovieId(value: string | string[] | undefined) {
  if (typeof value !== 'string') return null;

  const movieId = Number(value);
  return Number.isSafeInteger(movieId) && movieId > 0 ? movieId : null;
}

export async function getFavorites(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  res.json(await listFavorites(req.user.sub));
}

export async function postFavorite(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const movieId = getMovieId(req.params.movieId);
  if (!movieId) {
    res.status(400).json({ message: 'Filme inválido' });
    return;
  }

  try {
    const favorite = await addFavorite(req.user.sub, movieId);
    res.status(201).json(favorite);
  } catch (error) {
    res.status(404).json({
      message: error instanceof Error ? error.message : 'Não foi possível favoritar o filme',
    });
  }
}

export async function deleteFavorite(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const movieId = getMovieId(req.params.movieId);
  if (!movieId) {
    res.status(400).json({ message: 'Filme inválido' });
    return;
  }

  await removeFavorite(req.user.sub, movieId);
  res.status(204).send();
}
