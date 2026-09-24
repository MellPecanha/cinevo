import { Router } from 'express';

import {
  getCinemas,
  postCinema,
} from '../controllers/cinema.controller.js';

import { validate } from '../middlewares/validate.js';
import { createCinemaSchema } from '../schemas/cinema.schema.js';

export const cinemaRoutes = Router();

cinemaRoutes.get('/cinemas', getCinemas);

cinemaRoutes.post(
  '/cinemas',
  validate(createCinemaSchema),
  postCinema,
);
