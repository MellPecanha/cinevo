import { Router } from 'express';

import {
  getUsers,
  postUser,
} from '../controllers/user.controller.js';

import { validate } from '../middlewares/validate.js';

import {
  createUserSchema,
} from '../schemas/user.schema.js';

export const userRoutes = Router();

userRoutes.get(
  '/users',
  getUsers,
);

userRoutes.post(
  '/users',
  validate(createUserSchema),
  postUser,
);
