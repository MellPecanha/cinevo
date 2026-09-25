import { Router } from 'express';

import {
  postLogin,
} from '../controllers/auth.controller.js';

import { validate } from '../middlewares/validate.js';

import {
  loginSchema,
} from '../schemas/auth.schema.js';

export const authRoutes = Router();

authRoutes.post(
  '/auth/login',
  validate(loginSchema),
  postLogin,
);
