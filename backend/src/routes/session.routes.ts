import { Router } from 'express';

import {
  getSession,
  patchDeactivateSession,
  patchCancelSession,
  getSessions,
  postSession,
} from '../controllers/session.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorizeCinemaFromSessionBody } from '../middlewares/cinema-access.js';
import { authorizeCinemaFromSessionParam } from '../middlewares/cinema-access.js';

import {
  createSessionSchema,
} from '../schemas/session.schema.js';

export const sessionRoutes = Router();

sessionRoutes.get(
  '/sessions',
  getSessions,
);

sessionRoutes.get(
  '/sessions/:id',
  getSession,
);

sessionRoutes.post(
  '/sessions',
  authenticate,
  validate(createSessionSchema),
  authorizeCinemaFromSessionBody,
  postSession,
);

sessionRoutes.patch('/sessions/:id/deactivate', authenticate, authorizeCinemaFromSessionParam, patchDeactivateSession);
sessionRoutes.patch('/sessions/:id/cancel', authenticate, authorizeCinemaFromSessionParam, patchCancelSession);
