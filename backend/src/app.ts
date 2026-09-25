import express from 'express';

import { movieRoutes } from './routes/movie.routes.js';
import { cinemaRoutes } from './routes/cinema.routes.js';
import { roomRoutes } from './routes/room.routes.js';
import { sessionRoutes } from './routes/session.routes.js';
import { seatRoutes } from './routes/seat.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { authRoutes } from './routes/auth.routes.js';


export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cinevo-api',
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
