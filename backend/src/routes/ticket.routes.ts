import { Router } from 'express';

import { getCinemaSalesMetricsController, getCinemaTicketSales, postValidateTicket } from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { validateTicketSchema } from '../schemas/ticket.schema.js';
import { authorizeCinemaFromCinemaParam } from '../middlewares/cinema-access.js';

export const ticketRoutes = Router();

ticketRoutes.get(
  '/admin/cinemas/:cinemaId/tickets',
  authenticate,
  authorize('CINEMA_ADMIN', 'PLATFORM_ADMIN'),
  authorizeCinemaFromCinemaParam,
  getCinemaTicketSales,
);

ticketRoutes.get(
  '/admin/cinemas/:cinemaId/metrics',
  authenticate,
  authorize('CINEMA_ADMIN', 'PLATFORM_ADMIN'),
  authorizeCinemaFromCinemaParam,
  getCinemaSalesMetricsController,
);

ticketRoutes.post(
  '/tickets/validate',
  authenticate,
  authorize('CINEMA_ADMIN', 'PLATFORM_ADMIN'),
  validate(validateTicketSchema),
  postValidateTicket,
);
