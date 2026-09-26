import type { Request, Response } from 'express';

import { validateTicket } from '../services/ticket-validation.service.js';

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
