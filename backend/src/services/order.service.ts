import { db } from '../prisma/db.js';

import type {
  CreateOrderDTO,
} from '../dtos/order.dto.js';

const TICKET_PRICES = {
  FULL: 40,
  HALF: 20,
} as const;

const HOLD_DURATION_MINUTES = 10;

export async function createOrder(
  userId: number,
  data: CreateOrderDTO,
) {
  const session = await db.orm.public.Session
    .where({
      id: data.sessionId,
    })
    .first();

  if (!session) {
    throw new Error('Sessão não encontrada');
  }

  const seats = await db.orm.public.Seat
    .where({
      roomId: session.roomId,
    })
    .all();

  const seatMap = new Map(
    seats.map((seat) => [seat.id, seat]),
  );

  for (const ticket of data.tickets) {
    const seat = seatMap.get(ticket.seatId);

    if (!seat) {
      throw new Error(
        `Assento ${ticket.seatId} não pertence à sala da sessão`,
      );
    }
  }

  const tickets = await db.orm.public.Ticket
    .where({
      sessionId: data.sessionId,
    })
    .all();

  const holds = await db.orm.public.SeatHold
    .where({
      sessionId: data.sessionId,
    })
    .all();

  const now = new Date();

  const soldSeatIds = new Set(
    tickets.map((ticket) => ticket.seatId),
  );

  const activeHeldSeatIds = new Set(
    holds
      .filter(
        (hold) => new Date(hold.expiresAt) > now,
      )
      .map((hold) => hold.seatId),
  );

  for (const ticket of data.tickets) {
    if (soldSeatIds.has(ticket.seatId)) {
      throw new Error(
        `O assento ${ticket.seatId} já foi vendido`,
      );
    }

    if (activeHeldSeatIds.has(ticket.seatId)) {
      throw new Error(
        `O assento ${ticket.seatId} está temporariamente reservado`,
      );
    }
  }

  const total = data.tickets.reduce(
    (sum, ticket) => {
      return sum + TICKET_PRICES[ticket.type];
    },
    0,
  ).toFixed(2);

  const expiresAt = new Date(
    now.getTime() +
      HOLD_DURATION_MINUTES * 60 * 1000,
  ).toISOString();

  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.create({
      userId,
      status: 'PENDING',
      total,
    });

    const holds = data.tickets.map((ticket) => ({
      orderId: order.id,
      sessionId: data.sessionId,
      seatId: ticket.seatId,
      expiresAt,
    }));

    await tx.orm.public.SeatHold.createAll(holds);

    return order;
  });
}
