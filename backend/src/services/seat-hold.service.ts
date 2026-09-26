import { db } from '../prisma/db.js';

export async function expireSeatHolds(sessionId?: number) {
  const holds = sessionId
    ? await db.orm.public.SeatHold
      .where({ sessionId })
      .all()
    : await db.orm.public.SeatHold.all();

  const now = new Date();
  const expiredHolds = holds.filter(
    (hold) => new Date(hold.expiresAt) <= now,
  );

  if (expiredHolds.length === 0) {
    return {
      expiredHolds: 0,
      expiredOrders: 0,
    };
  }

  const expiredOrderIds = new Set(
    expiredHolds.map((hold) => hold.orderId),
  );

  return db.transaction(async (tx) => {
    for (const hold of expiredHolds) {
      await tx.orm.public.SeatHold
        .where({ id: hold.id })
        .delete();
    }

    let expiredOrders = 0;

    for (const orderId of expiredOrderIds) {
      const remainingHolds = await tx.orm.public.SeatHold
        .where({ orderId })
        .all();

      const order = await tx.orm.public.Order
        .where({ id: orderId })
        .first();

      if (
        remainingHolds.length === 0 &&
        order?.status === 'PENDING'
      ) {
        await tx.orm.public.Order
          .where({ id: orderId })
          .update({ status: 'EXPIRED' });

        expiredOrders++;
      }
    }

    return {
      expiredHolds: expiredHolds.length,
      expiredOrders,
    };
  });
}
