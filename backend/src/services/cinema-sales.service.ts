import { db } from '../prisma/db.js';

function sumMoney(values: unknown[]) {
  const cents = values.reduce<bigint>((total, value) => {
    const [whole, fraction = ''] = String(value).split('.');
    return total + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  }, 0n);

  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
}

export async function listCinemaTicketSales(cinemaId: number) {
  const tickets = await db.orm.public.Ticket
    .include('seat')
    .include('order', (order) => order.include('user'))
    .include('session', (session) =>
      session
        .include('movie')
        .include('room'),
    )
    .all();

  return tickets
    .filter((ticket) => ticket.session?.room.cinemaId === cinemaId && ticket.order?.user)
    .map((ticket) => ({
      id: ticket.id,
      code: ticket.code,
      status: ticket.status,
      type: ticket.type,
      price: ticket.price,
      seat: { row: ticket.seat.row, number: ticket.seat.number },
      buyer: { name: ticket.order!.user.name, email: ticket.order!.user.email },
      session: {
        startsAt: ticket.session!.startsAt,
        movie: { title: ticket.session!.movie.title },
        room: { number: ticket.session!.room.number },
      },
    }));
}

export async function getCinemaSalesMetrics(cinemaId: number) {
  const [sessions, tickets, seats] = await Promise.all([
    db.orm.public.Session.include('room').all(),
    db.orm.public.Ticket.all(),
    db.orm.public.Seat.include('room').all(),
  ]);

  const cinemaSessions = sessions.filter((session) => session.room.cinemaId === cinemaId);
  const sessionIds = new Set(cinemaSessions.map((session) => session.id));
  const soldTickets = tickets.filter((ticket) => sessionIds.has(ticket.sessionId) && ticket.status !== 'CANCELLED');
  const cinemaSeatCount = seats.filter((seat) => seat.room.cinemaId === cinemaId).length;
  const capacity = cinemaSeatCount * cinemaSessions.length;

  return {
    ticketsSold: soldTickets.length,
    activeTickets: soldTickets.filter((ticket) => ticket.status === 'ACTIVE').length,
    revenue: sumMoney(soldTickets.map((ticket) => ticket.price)),
    occupancy: capacity === 0 ? 0 : Math.round((soldTickets.length / capacity) * 100),
    upcomingSessions: cinemaSessions.filter((session) => session.isActive && new Date(session.startsAt) >= new Date()).length,
  };
}
