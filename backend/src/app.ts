import express from 'express';
import { movieRoutes } from './routes/movie.routes.js';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cinevo-api',
  });
});

app.use(movieRoutes);
