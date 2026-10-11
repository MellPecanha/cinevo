import { Router } from 'express';

import {
  getMovies,
  patchMovie,
  patchDeactivateMovie,
  postMovie,
} from '../controllers/movie.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema.js';

export const movieRoutes = Router();

movieRoutes.get('/movies', getMovies);

movieRoutes.post(
  '/movies',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  validate(createMovieSchema),
  postMovie,
);

movieRoutes.patch(
  '/movies/:id',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  validate(updateMovieSchema),
  patchMovie,
);

movieRoutes.patch('/movies/:id/deactivate', authenticate, authorize('PLATFORM_ADMIN'), patchDeactivateMovie);
