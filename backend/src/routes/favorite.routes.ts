import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate.js';
import {
  deleteFavorite,
  getFavorites,
  postFavorite,
} from '../controllers/favorite.controller.js';

export const favoriteRoutes = Router();

favoriteRoutes.get('/favorites', authenticate, getFavorites);
favoriteRoutes.post('/favorites/:movieId', authenticate, postFavorite);
favoriteRoutes.delete('/favorites/:movieId', authenticate, deleteFavorite);
