import { db } from '../prisma/db.js';

export async function assignCinemaAdmin(
  cinemaId: number,
  userId: number,
) {
  return db.transaction(async (tx) => {
    const cinema = await tx.orm.public.Cinema
      .where({ id: cinemaId })
      .first();

    if (!cinema) {
      throw new Error('Cinema não encontrado');
    }

    const user = await tx.orm.public.User
      .where({ id: userId })
      .first();

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role === 'PLATFORM_ADMIN') {
      throw new Error(
        'Um administrador da plataforma não pode ser vinculado como administrador de cinema',
      );
    }

    const existingAssignment = await tx.orm.public.CinemaAdmin
      .where({ cinemaId, userId })
      .first();

    if (existingAssignment) {
      throw new Error('O usuário já administra este cinema');
    }

    if (user.role !== 'CINEMA_ADMIN') {
      await tx.orm.public.User
        .where({ id: userId })
        .update({ role: 'CINEMA_ADMIN' });
    }

    return tx.orm.public.CinemaAdmin.create({
      cinemaId,
      userId,
    });
  });
}
