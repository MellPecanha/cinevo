import { db } from '../prisma/db.js';

type ValidatorRole = 'CINEMA_ADMIN' | 'PLATFORM_ADMIN';

export async function validateTicket(
  userId: number,
  role: ValidatorRole,
  code: string,
) {
  return db.transaction(async (tx) => {
    const ticket = await tx.orm.public.Ticket
      .include('session', (session) =>
        session.include('room'),
      )
      .where({ code })
      .first();

    if (!ticket) {
      throw new Error('Ingresso não encontrado');
    }

    if (ticket.status === 'CANCELLED') {
      throw new Error('Ingresso cancelado');
    }

    if (ticket.status === 'USED') {
      throw new Error('Ingresso já utilizado');
    }

    if (!ticket.session) {
      throw new Error('Sessão do ingresso não encontrada');
    }

    if (role === 'CINEMA_ADMIN') {
      const cinemaAdmin = await tx.orm.public.CinemaAdmin
        .where({
          cinemaId: ticket.session.room.cinemaId,
          userId,
        })
        .first();

      if (!cinemaAdmin) {
        throw new Error(
          'Usuário não administra o cinema desta sessão',
        );
      }
    }

    const usedAt = new Date().toISOString();

    const usedTicket = await tx.orm.public.Ticket
      .where({ id: ticket.id })
      .update({
        status: 'USED',
        usedAt,
      });

    return usedTicket;
  });
}
