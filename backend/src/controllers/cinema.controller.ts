import type { Request, Response } from 'express';

import {
  createCinema,
  listCinemas,
} from '../services/cinema.service.js';
import { assignCinemaAdmin } from '../services/cinema-admin.service.js';

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

export async function postCinemaAdmin(
  req: Request,
  res: Response,
) {
  const cinemaId = Number(req.params.cinemaId);

  if (!Number.isSafeInteger(cinemaId) || cinemaId <= 0) {
    res.status(400).json({
      message: 'Cinema inválido',
    });
    return;
  }

  try {
    const cinemaAdmin = await assignCinemaAdmin(
      cinemaId,
      req.body.userId,
    );

    res.status(201).json(cinemaAdmin);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível vincular o administrador ao cinema';

    res.status(400).json({
      message,
    });
  }
}
