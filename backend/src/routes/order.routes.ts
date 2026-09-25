import { Router } from 'express';

import {
  postOrder,
} from '../controllers/order.controller.js';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

import {
  createOrderSchema,
} from '../schemas/order.schema.js';

export const orderRoutes = Router();

orderRoutes.post(
  '/orders',
  authenticate,
  validate(createOrderSchema),
  postOrder,
);
