import { Router } from 'express';
import { getMovies } from '../controllers/movie.controller.js';

export const movieRoutes = Router();

movieRoutes.get('/movies', getMovies);
