import { db } from '../prisma/db.js';

export async function getSessionSeats(sessionId: number) {
  const session = await db.orm.public.Session
    .where({
      id: sessionId,
    })
    .first();

  if (!session) {
    return null;
  }

  const seats = await db.orm.public.Seat
    .where({
      roomId: session.roomId,
    })
    .all();

  const tickets = await db.orm.public.Ticket
    .where({
      sessionId,
    })
    .all();

  const soldSeatIds = new Set(
    tickets.map((ticket) => ticket.seatId),
  );

  return seats.map((seat) => ({
    id: seat.id,
    row: seat.row,
    number: seat.number,
    type: seat.type,
    status: soldSeatIds.has(seat.id)
      ? 'SOLD'
      : 'AVAILABLE',
  }));
}
