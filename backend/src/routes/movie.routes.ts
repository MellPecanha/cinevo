import { Router } from 'express';

import {
  getMovies,
  postMovie,
} from '../controllers/movie.controller.js';

import { validate } from '../middlewares/validate.js';
import { createMovieSchema } from '../schemas/movie.schema.js';

export const movieRoutes = Router();

movieRoutes.get('/movies', getMovies);

movieRoutes.post(
  '/movies',
  validate(createMovieSchema),
  postMovie,
);
