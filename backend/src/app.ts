import express from 'express';

import { movieRoutes } from './routes/movie.routes.js';
import { cinemaRoutes } from './routes/cinema.routes.js';
import { roomRoutes } from './routes/room.routes.js';


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
