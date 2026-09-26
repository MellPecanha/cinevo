import { db } from '../prisma/db.js';
import { expireSeatHolds } from './seat-hold.service.js';

import type {
  CreateOrderDTO,
} from '../dtos/order.dto.js';

type TicketType = 'FULL' | 'HALF';

const HOLD_DURATION_MINUTES = 10;

function moneyToCents(value: unknown) {
  const normalized = String(value);

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('O preço da sessão é inválido');
  }

  const [whole, fraction = ''] = normalized.split('.');

  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

function centsToMoney(cents: bigint) {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');

  return `${whole}.${fraction}`;
}

function ticketPriceInCents(
  sessionPriceInCents: bigint,
  type: TicketType,
) {
  if (type === 'HALF') {
    return (sessionPriceInCents + 1n) / 2n;
  }

  return sessionPriceInCents;
}

function includeOrderDetails() {
  return db.orm.public.Order
    .include('tickets', (tickets) =>
      tickets
        .include('seat')
        .include('session', (session) =>
          session
            .include('movie')
            .include('room', (room) => room.include('cinema')),
        ),
    )
    .include('holds', (holds) =>
      holds
        .include('seat')
        .include('session', (session) =>
          session
            .include('movie')
            .include('room', (room) => room.include('cinema')),
        ),
    );
}

export async function listOrdersByUser(userId: number) {
  await expireSeatHolds();

  return includeOrderDetails()
    .where({ userId })
    .orderBy((order) => order.createdAt.desc())
    .all();
}

export async function getOrderById(
  userId: number,
  orderId: number,
) {
  await expireSeatHolds();

  return includeOrderDetails()
    .where({ id: orderId })
    .where({ userId })
    .first();
}

export async function listTicketsByUser(userId: number) {
  const orders = await listOrdersByUser(userId);

  return orders.flatMap((order) => order.tickets);
}

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

  await expireSeatHolds(data.sessionId);

  const selectedSeatIds = data.tickets.map(
    (ticket) => ticket.seatId,
  );

  if (new Set(selectedSeatIds).size !== selectedSeatIds.length) {
    throw new Error('Não é permitido selecionar o mesmo assento mais de uma vez');
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
        `O assento ${ticket.seatId} não pertence à sala da sessão`,
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
    tickets
      .filter((ticket) => ticket.status === 'ACTIVE')
      .map((ticket) => ticket.seatId),
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

  const sessionPriceInCents = moneyToCents(session.price);

  if (sessionPriceInCents <= 0n) {
    throw new Error('A sessão não possui um preço válido');
  }

  const heldTickets = data.tickets.map((ticket) => {
    const priceInCents = ticketPriceInCents(
      sessionPriceInCents,
      ticket.type,
    );

    return {
      ...ticket,
      price: centsToMoney(priceInCents),
      priceInCents,
    };
  });

  const total = centsToMoney(
    heldTickets.reduce(
      (sum, ticket) => sum + ticket.priceInCents,
      0n,
    ),
  );

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

    const seatHolds = heldTickets.map((ticket) => ({
      orderId: order.id,
      sessionId: data.sessionId,
      seatId: ticket.seatId,
      type: ticket.type,
      price: ticket.price,
      expiresAt,
    }));

    await tx.orm.public.SeatHold.createAll(seatHolds);

    return order;
  });
}
