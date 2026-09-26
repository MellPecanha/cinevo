import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { db } from '../prisma/db.js';

function getPositiveInteger(value: unknown) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

async function authorizeCinemaAccess(
  req: Request,
  res: Response,
  next: NextFunction,
  cinemaId: number,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  if (req.user.role === 'PLATFORM_ADMIN') {
    next();
    return;
  }

  if (req.user.role !== 'CINEMA_ADMIN') {
    res.status(403).json({
      message: 'Usuário não possui permissão para administrar este cinema',
    });
    return;
  }

  const cinemaAdmin = await db.orm.public.CinemaAdmin
    .where({
      cinemaId,
      userId: req.user.sub,
    })
    .first();

  if (!cinemaAdmin) {
    res.status(403).json({
      message: 'Usuário não administra este cinema',
    });
    return;
  }

  next();
}

export async function authorizeCinemaFromBody(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const cinemaId = getPositiveInteger(req.body.cinemaId);

  if (!cinemaId) {
    res.status(400).json({
      message: 'Cinema inválido',
    });
    return;
  }

  await authorizeCinemaAccess(req, res, next, cinemaId);
}

export async function authorizeCinemaFromRoomParam(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const roomId = getPositiveInteger(req.params.roomId);

  if (!roomId) {
    res.status(400).json({
      message: 'Sala inválida',
    });
    return;
  }

  const room = await db.orm.public.Room
    .where({ id: roomId })
    .first();

  if (!room) {
    res.status(404).json({
      message: 'Sala não encontrada',
    });
    return;
  }

  await authorizeCinemaAccess(req, res, next, room.cinemaId);
}

export async function authorizeCinemaFromSessionBody(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const roomId = getPositiveInteger(req.body.roomId);

  if (!roomId) {
    res.status(400).json({
      message: 'Sala inválida',
    });
    return;
  }

  const room = await db.orm.public.Room
    .where({ id: roomId })
    .first();

  if (!room) {
    res.status(404).json({
      message: 'Sala não encontrada',
    });
    return;
  }

  await authorizeCinemaAccess(req, res, next, room.cinemaId);
}
