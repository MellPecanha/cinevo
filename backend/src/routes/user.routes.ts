import { Router } from 'express';

import {
  getUsers,
  postUser,
} from '../controllers/user.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

import {
  createUserSchema,
} from '../schemas/user.schema.js';

export const userRoutes = Router();

userRoutes.get(
  '/users',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  getUsers,
);

userRoutes.post(
  '/users',
  validate(createUserSchema),
  postUser,
);
