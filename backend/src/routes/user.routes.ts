import { Router } from 'express';

import {
  getUsers,
  patchProfile,
  patchUserRole,
  postUser,
} from '../controllers/user.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

import {
  createUserSchema,
  updateProfileSchema,
  updateUserRoleSchema,
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

userRoutes.patch(
  '/users/me',
  authenticate,
  validate(updateProfileSchema),
  patchProfile,
);

userRoutes.patch('/users/:id/role', authenticate, authorize('PLATFORM_ADMIN'), validate(updateUserRoleSchema), patchUserRole);
