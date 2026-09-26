import { Router } from 'express';

import { postValidateTicket } from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { validateTicketSchema } from '../schemas/ticket.schema.js';

export const ticketRoutes = Router();

ticketRoutes.post(
  '/tickets/validate',
  authenticate,
  authorize('CINEMA_ADMIN', 'PLATFORM_ADMIN'),
  validate(validateTicketSchema),
  postValidateTicket,
);
