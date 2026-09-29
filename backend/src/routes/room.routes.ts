import { Router } from 'express';

import {
  getRooms,
  patchDeactivateRoom,
  postRoom,
} from '../controllers/room.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeCinemaFromBody } from '../middlewares/cinema-access.js';
import { authorizeCinemaFromRoomParam } from '../middlewares/cinema-access.js';
import { createRoomSchema } from '../schemas/room.schema.js';

export const roomRoutes = Router();

roomRoutes.get('/rooms', getRooms);

roomRoutes.post(
  '/rooms',
  authenticate,
  validate(createRoomSchema),
  authorizeCinemaFromBody,
  postRoom,
);

roomRoutes.patch('/rooms/:roomId/deactivate', authenticate, authorizeCinemaFromRoomParam, patchDeactivateRoom);
