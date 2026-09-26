import { db } from '../prisma/db.js';
import { expireSeatHolds } from './seat-hold.service.js';

export async function getSessionSeats(sessionId: number) {
  const session = await db.orm.public.Session
    .where({
      id: sessionId,
    })
    .first();

  if (!session) {
    return null;
  }

  await expireSeatHolds(sessionId);

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

  const holds = await db.orm.public.SeatHold
    .where({
      sessionId,
    })
    .all();

  const now = new Date();

  const soldSeatIds = new Set(
    tickets.map((ticket) => ticket.seatId),
  );

  const heldSeatIds = new Set(
    holds
      .filter(
        (hold) => new Date(hold.expiresAt) > now,
      )
      .map((hold) => hold.seatId),
  );

  return seats.map((seat) => {
    let status: 'AVAILABLE' | 'HELD' | 'SOLD';

    if (soldSeatIds.has(seat.id)) {
      status = 'SOLD';
    } else if (heldSeatIds.has(seat.id)) {
      status = 'HELD';
    } else {
      status = 'AVAILABLE';
    }

    return {
      id: seat.id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      status,
    };
  });
}
