import { Router } from 'express';

import {
  getSeatsByRoom,
  getSeatsBySession,
  postGenerateSeats,
} from '../controllers/seat.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeCinemaFromRoomParam } from '../middlewares/cinema-access.js';
import {
  generateSeatsSchema,
} from '../schemas/seat.schema.js';

export const seatRoutes = Router();

seatRoutes.get(
  '/rooms/:roomId/seats',
  getSeatsByRoom,
);

seatRoutes.post(
  '/rooms/:roomId/seats',
  authenticate,
  validate(generateSeatsSchema),
  authorizeCinemaFromRoomParam,
  postGenerateSeats,
);

seatRoutes.get(
  '/sessions/:sessionId/seats',
  getSeatsBySession,
);
