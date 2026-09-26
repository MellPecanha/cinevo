import { Router } from 'express';

import {
  getCinemas,
  postCinemaAdmin,
  postCinema,
} from '../controllers/cinema.controller.js';

import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { assignCinemaAdminSchema } from '../schemas/cinema-admin.schema.js';
import { createCinemaSchema } from '../schemas/cinema.schema.js';

export const cinemaRoutes = Router();

cinemaRoutes.get('/cinemas', getCinemas);

cinemaRoutes.post(
  '/cinemas',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  validate(createCinemaSchema),
  postCinema,
);

cinemaRoutes.post(
  '/cinemas/:cinemaId/admins',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  validate(assignCinemaAdminSchema),
  postCinemaAdmin,
);
