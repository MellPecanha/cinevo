import { db } from '../prisma/db.js';
import { NotFoundError } from '../errors/app-error.js';

export async function cancelSession(sessionId: number) {
  const result = await db.transaction(async (tx) => {
    const session = await tx.orm.public.Session.where({ id: sessionId }).first();
    if (!session) throw new NotFoundError('Sessão não encontrada');

    const tickets = await tx.orm.public.Ticket.where({ sessionId }).all();
    const orderIds = [...new Set(tickets.filter((ticket) => ticket.status !== 'CANCELLED').map((ticket) => ticket.orderId))];

    await tx.orm.public.Session.where({ id: sessionId }).update({ isActive: false });
    await tx.orm.public.Ticket.where({ sessionId }).update({ status: 'CANCELLED' });

    for (const orderId of orderIds) {
      await tx.orm.public.Order.where({ id: orderId }).update({ status: 'CANCELLED' });
    }

    return { cancelledTickets: tickets.length, affectedOrders: orderIds.length };
  });

  console.info(JSON.stringify({ level: 'info', event: 'session_cancelled', sessionId, ...result }));
  return result;
}
