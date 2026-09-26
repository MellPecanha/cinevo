import { randomUUID } from 'node:crypto';

import { db } from '../prisma/db.js';
import { expireSeatHolds } from './seat-hold.service.js';

function createTicketCode() {
  return `CV-${randomUUID().replaceAll('-', '').toUpperCase()}`;
}

function hasPositivePrice(value: unknown) {
  const normalized = String(value);

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return false;
  }

  const [whole, fraction = ''] = normalized.split('.');
  const cents =
    BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));

  return cents > 0n;
}

export async function payOrder(
  userId: number,
  orderId: number,
) {
  await expireSeatHolds();

  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order
      .where({
        id: orderId,
      })
      .first();

    if (!order || order.userId !== userId) {
      throw new Error('Pedido não encontrado');
    }

    if (order.status === 'EXPIRED') {
      throw new Error('A reserva dos assentos expirou');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Apenas pedidos pendentes podem ser pagos');
    }

    const holds = await tx.orm.public.SeatHold
      .where({
        orderId,
      })
      .all();

    if (holds.length === 0) {
      throw new Error('O pedido não possui assentos reservados');
    }

    if (new Set(holds.map((hold) => hold.sessionId)).size !== 1) {
      throw new Error('O pedido possui reservas inválidas');
    }

    const now = new Date();
    const hasExpiredHold = holds.some(
      (hold) => new Date(hold.expiresAt) <= now,
    );

    if (hasExpiredHold) {
      throw new Error('A reserva dos assentos expirou');
    }

    if (holds.some((hold) => !hasPositivePrice(hold.price))) {
      throw new Error(
        'Este pedido não possui uma cotação válida e deve ser criado novamente',
      );
    }

    const soldTickets = await tx.orm.public.Ticket
      .where({
        sessionId: holds[0].sessionId,
      })
      .all();

    const soldSeatIds = new Set(
      soldTickets
        .filter((ticket) => ticket.status === 'ACTIVE')
        .map((ticket) => ticket.seatId),
    );

    if (holds.some((hold) => soldSeatIds.has(hold.seatId))) {
      throw new Error('Um dos assentos selecionados já foi vendido');
    }

    const tickets = holds.map((hold) => ({
      orderId,
      sessionId: hold.sessionId,
      seatId: hold.seatId,
      type: hold.type,
      price: String(hold.price),
      code: createTicketCode(),
    }));

    await tx.orm.public.Ticket.createAll(tickets);

    await tx.orm.public.SeatHold
      .where({
        orderId,
      })
      .delete();

    const paidOrder = await tx.orm.public.Order
      .where({
        id: orderId,
      })
      .update({
        status: 'PAID',
      });

    return {
      order: paidOrder,
      tickets,
    };
  });
}
