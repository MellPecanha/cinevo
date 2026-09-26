import { Router } from 'express';

import { getDashboard } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/admin/dashboard',
  authenticate,
  authorize('PLATFORM_ADMIN'),
  getDashboard,
);
