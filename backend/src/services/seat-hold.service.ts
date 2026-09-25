import { db } from '../prisma/db.js';

const HOLD_DURATION_MINUTES = 10;

export async function createSeatHold(
  orderId: number,
  sessionId: number,
  seatId: number,
) {
  const expiresAt = new Date(
    Date.now() + HOLD_DURATION_MINUTES * 60 * 1000,
  ).toISOString();

  return db.orm.public.SeatHold.create({
    orderId,
    sessionId,
    seatId,
    expiresAt,
  });
}
