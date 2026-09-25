import type { Request, Response } from 'express';

import {
  generateSeats,
  listSeatsByRoom,
} from '../services/seat.service.js';

export async function getSeatsByRoom(
  req: Request,
  res: Response,
) {
  const roomId = Number(req.params.roomId);

  const seats = await listSeatsByRoom(roomId);

  res.json(seats);
}

export async function postGenerateSeats(
  req: Request,
  res: Response,
) {
  const roomId = Number(req.params.roomId);

  const seats = await generateSeats(
    roomId,
    req.body,
  );

  res.status(201).json(seats);
}
