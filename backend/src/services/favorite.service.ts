import { db } from '../prisma/db.js';

export async function listFavorites(userId: number) {
  return db.orm.public.Favorite
    .include('movie')
    .where({ userId })
    .orderBy((favorite) => favorite.createdAt.desc())
    .all();
}

export async function addFavorite(userId: number, movieId: number) {
  const movie = await db.orm.public.Movie
    .where({ id: movieId })
    .first();

  if (!movie) {
    throw new Error('Filme não encontrado');
  }

  const favorite = await db.orm.public.Favorite
    .where({ userId, movieId })
    .first();

  if (favorite) {
    return favorite;
  }

  return db.orm.public.Favorite.create({ userId, movieId });
}

export async function removeFavorite(userId: number, movieId: number) {
  const favorite = await db.orm.public.Favorite
    .where({ userId, movieId })
    .first();

  if (!favorite) {
    return false;
  }

  await db.orm.public.Favorite
    .where({ userId, movieId })
    .delete();

  return true;
}
