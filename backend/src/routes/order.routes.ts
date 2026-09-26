import { Router } from 'express';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  postOrder,
  postPayOrder,
} from '../controllers/order.controller.js';
import { createOrderSchema } from '../schemas/order.schema.js';

export const orderRoutes = Router();

orderRoutes.post(
  '/orders',
  authenticate,
  validate(createOrderSchema),
  postOrder,
);

orderRoutes.post(
  '/orders/:id/pay',
  authenticate,
  postPayOrder,
);
