import express from 'express';

import { movieRoutes } from './routes/movie.routes.js';
import { cinemaRoutes } from './routes/cinema.routes.js';
import { roomRoutes } from './routes/room.routes.js';
import { sessionRoutes } from './routes/session.routes.js';
import { seatRoutes } from './routes/seat.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { ticketRoutes } from './routes/ticket.routes.js';
import { favoriteRoutes } from './routes/favorite.routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';


export const app = express();

const allowedOrigins = (process.env['FRONTEND_ORIGIN'] ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

app.use(movieRoutes);
app.use(cinemaRoutes);
app.use(roomRoutes);
app.use(sessionRoutes);
app.use(seatRoutes);
app.use(orderRoutes);
app.use(userRoutes);
app.use(authRoutes);
app.use(ticketRoutes);
app.use(favoriteRoutes);
app.use(dashboardRoutes);
app.use(errorHandler);
