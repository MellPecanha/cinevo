import { Router } from 'express';

import {
  getRooms,
  postRoom,
} from '../controllers/room.controller.js';

import { validate } from '../middlewares/validate.js';
import { createRoomSchema } from '../schemas/room.schema.js';

export const roomRoutes = Router();

roomRoutes.get('/rooms', getRooms);

roomRoutes.post(
  '/rooms',
  validate(createRoomSchema),
  postRoom,
);
