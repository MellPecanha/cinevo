import { Router } from 'express';

import {
  getSessions,
  postSession,
} from '../controllers/session.controller.js';

import { validate } from '../middlewares/validate.js';

import {
  createSessionSchema,
} from '../schemas/session.schema.js';

export const sessionRoutes = Router();

sessionRoutes.get(
  '/sessions',
  getSessions,
);

sessionRoutes.post(
  '/sessions',
  validate(createSessionSchema),
  postSession,
);
