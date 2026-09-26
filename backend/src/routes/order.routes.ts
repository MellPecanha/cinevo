import { Router } from 'express';

import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  getOrder,
  getOrders,
  getTickets,
  postOrder,
  postPayOrder,
} from '../controllers/order.controller.js';
import { createOrderSchema } from '../schemas/order.schema.js';

export const orderRoutes = Router();

orderRoutes.get(
  '/orders',
  authenticate,
  getOrders,
);

orderRoutes.get(
  '/orders/:id',
  authenticate,
  getOrder,
);

orderRoutes.get(
  '/tickets',
  authenticate,
  getTickets,
);

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
