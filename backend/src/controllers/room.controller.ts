import type { Request, Response } from 'express';

import {
  createRoom,
  deactivateRoom,
  listRooms,
} from '../services/room.service.js';

export async function getRooms(
  _req: Request,
  res: Response,
) {
  const rooms = await listRooms();

  res.json(rooms);
}

export async function patchDeactivateRoom(req: Request, res: Response) {
  const roomId = Number(req.params.roomId);
  res.json(await deactivateRoom(roomId));
}

export async function postRoom(
  req: Request,
  res: Response,
) {
  const room = await createRoom(req.body);

  res.status(201).json(room);
}
