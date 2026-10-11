import { db } from '../prisma/db.js';

import type {
  GenerateSeatsDTO,
  SetSeatAvailabilityDTO,
} from '../dtos/seat.dto.js';

type SeatType = 'STANDARD' | 'VIP' | 'ACCESSIBLE';

function getRowLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export async function listSeatsByRoom(roomId: number) {
  return db.orm.public.Seat
    .where({ roomId })
    .all();
}

export async function generateSeats(
  roomId: number,
  data: GenerateSeatsDTO,
) {
  const room = await db.orm.public.Room
    .where({ id: roomId })
    .first();

  if (!room) {
    throw new Error('Sala não encontrada');
  }

  const existingSeats = await db.orm.public.Seat
    .where({ roomId })
    .all();

  if (existingSeats.length > 0) {
    throw new Error(
      'Esta sala já possui assentos configurados',
    );
  }

  const seats: {
    row: string;
    number: number;
    type: SeatType;
    roomId: number;
  }[] = [];

  for (let rowIndex = 0; rowIndex < data.rowSeats.length; rowIndex++) {
    const row = getRowLetter(rowIndex);

    for (
      let seatNumber = 1;
      seatNumber <= data.rowSeats[rowIndex];
      seatNumber++
    ) {
      const seatCode = `${row}${String(seatNumber).padStart(2, '0')}`;

      const type: SeatType = data.accessibleSeats.includes(seatCode)
        ? 'ACCESSIBLE'
        : room.type === 'VIP' || data.vipSeats.includes(seatCode)
          ? 'VIP'
          : 'STANDARD';

      seats.push({
        row,
        number: seatNumber,
        type,
        roomId,
      });
    }
  }

  return db.orm.public.Seat.createAll(seats);
}

export async function setSeatAvailability(
  roomId: number,
  seatId: number,
  data: SetSeatAvailabilityDTO,
) {
  return db.transaction(async (tx) => {
    const seat = await tx.orm.public.Seat
      .where({ id: seatId, roomId })
      .first();

    if (!seat) {
      throw new Error('Assento não encontrado nesta sala');
    }

    if (!data.isAvailable) {
      const now = new Date();
      const holds = await tx.orm.public.SeatHold.where({ seatId }).all();
      const hasActiveHold = holds.some((hold) => new Date(hold.expiresAt) > now);

      if (hasActiveHold) {
        throw new Error('Não é possível colocar este assento em manutenção enquanto há uma reserva ativa');
      }

      const tickets = await tx.orm.public.Ticket
        .include('session')
        .where({ seatId, status: 'ACTIVE' })
        .all();
      const hasUpcomingTicket = tickets.some((ticket) =>
        ticket.session && new Date(ticket.session.startsAt) > now,
      );

      if (hasUpcomingTicket) {
        throw new Error('Não é possível colocar este assento em manutenção enquanto há ingresso ativo para uma sessão futura');
      }
    }

    return tx.orm.public.Seat
      .where({ id: seatId })
      .update({ isAvailable: data.isAvailable });
  });
}
