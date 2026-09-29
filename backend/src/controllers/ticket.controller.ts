import type { Request, Response } from 'express';

import { validateTicket } from '../services/ticket-validation.service.js';
import { getCinemaSalesMetrics, listCinemaTicketSales } from '../services/cinema-sales.service.js';

export async function getCinemaTicketSales(req: Request, res: Response) {
  const cinemaId = Number(req.params.cinemaId);

  if (!Number.isSafeInteger(cinemaId) || cinemaId <= 0) {
    res.status(400).json({ message: 'Cinema inválido' });
    return;
  }

  res.json(await listCinemaTicketSales(cinemaId));
}

export async function getCinemaSalesMetricsController(req: Request, res: Response) {
  const cinemaId = Number(req.params.cinemaId);

  if (!Number.isSafeInteger(cinemaId) || cinemaId <= 0) {
    res.status(400).json({ message: 'Cinema inválido' });
    return;
  }

  res.json(await getCinemaSalesMetrics(cinemaId));
}

export async function postValidateTicket(
  req: Request,
  res: Response,
) {
  if (
    !req.user ||
    (
      req.user.role !== 'CINEMA_ADMIN' &&
      req.user.role !== 'PLATFORM_ADMIN'
    )
  ) {
    res.status(403).json({
      message: 'Usuário não possui permissão para esta operação',
    });
    return;
  }

  try {
    const ticket = await validateTicket(
      req.user.sub,
      req.user.role,
      req.body.code,
    );

    res.json(ticket);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível validar o ingresso';

    res.status(400).json({
      message,
    });
  }
}
