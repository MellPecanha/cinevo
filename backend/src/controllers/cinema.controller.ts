import type { Request, Response } from 'express';

import {
  createCinema,
  listCinemas,
} from '../services/cinema.service.js';

export async function getCinemas(
  _req: Request,
  res: Response,
) {
  const cinemas = await listCinemas();

  res.json(cinemas);
}

export async function postCinema(
  req: Request,
  res: Response,
) {
  const cinema = await createCinema(req.body);

  res.status(201).json(cinema);
}
