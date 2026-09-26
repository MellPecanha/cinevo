import { db } from '../prisma/db.js';

const CANCELLATION_DEADLINE_MS = 2 * 60 * 60 * 1000;

export async function cancelOrder(
  userId: number,
  orderId: number,
) {
  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order
      .where({ id: orderId })
      .first();

    if (!order || order.userId !== userId) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status !== 'PAID') {
      throw new Error('Apenas pedidos pagos podem ser cancelados');
    }

    const tickets = await tx.orm.public.Ticket
      .where({ orderId })
      .all();

    if (tickets.length === 0) {
      throw new Error('O pedido não possui ingressos para cancelar');
    }

    if (new Set(tickets.map((ticket) => ticket.sessionId)).size !== 1) {
      throw new Error('O pedido possui ingressos inválidos');
    }

    const session = await tx.orm.public.Session
      .where({ id: tickets[0].sessionId })
      .first();

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const cancellationDeadline = new Date(
      new Date(session.startsAt).getTime() - CANCELLATION_DEADLINE_MS,
    );

    if (new Date() > cancellationDeadline) {
      throw new Error(
        'O cancelamento é permitido somente até 2 horas antes da sessão',
      );
    }

    await tx.orm.public.Ticket
      .where({ orderId })
      .update({ status: 'CANCELLED' });

    const cancelledOrder = await tx.orm.public.Order
      .where({ id: orderId })
      .update({ status: 'CANCELLED' });

    return cancelledOrder;
  });
}
