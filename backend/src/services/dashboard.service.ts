import { db } from '../prisma/db.js';

function sumMoney(values: unknown[]) {
  const cents = values.reduce<bigint>((total, value) => {
    const [whole, fraction = ''] = String(value).split('.');
    return total + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  }, 0n);

  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
}

export async function getDashboardMetrics() {
  const [cinemas, movies, orders, tickets] = await Promise.all([
    db.orm.public.Cinema.all(),
    db.orm.public.Movie.all(),
    db.orm.public.Order.all(),
    db.orm.public.Ticket.all(),
  ]);

  const paidOrders = orders.filter((order) => order.status === 'PAID');

  return {
    cinemas: cinemas.length,
    movies: movies.length,
    paidOrders: paidOrders.length,
    activeTickets: tickets.filter((ticket) => ticket.status === 'ACTIVE').length,
    revenue: sumMoney(paidOrders.map((order) => order.total)),
  };
}
