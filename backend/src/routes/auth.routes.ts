import { Router } from 'express';

import {
  getMe,
  postLogin,
} from '../controllers/auth.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

import {
  loginSchema,
} from '../schemas/auth.schema.js';

export const authRoutes = Router();

authRoutes.get(
  '/auth/me',
  authenticate,
  getMe,
);

authRoutes.post(
  '/auth/login',
  validate(loginSchema),
  postLogin,
);
