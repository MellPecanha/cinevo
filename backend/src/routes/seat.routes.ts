import { Router } from 'express';

import {
  getSeatsByRoom,
  getSeatsBySession,
  postGenerateSeats,
} from '../controllers/seat.controller.js';

import { validate } from '../middlewares/validate.js';
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
  validate(generateSeatsSchema),
  postGenerateSeats,
);

seatRoutes.get(
  '/sessions/:sessionId/seats',
  getSeatsBySession,
);
