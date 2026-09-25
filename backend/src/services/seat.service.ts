import { db } from '../prisma/db.js';

import type {
  GenerateSeatsDTO,
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

  for (let rowIndex = 0; rowIndex < data.rows; rowIndex++) {
    const row = getRowLetter(rowIndex);

    for (
      let seatNumber = 1;
      seatNumber <= data.seatsPerRow;
      seatNumber++
    ) {
      const seatCode = `${row}${String(seatNumber).padStart(2, '0')}`;

      const type: SeatType = data.accessibleSeats.includes(seatCode)
        ? 'ACCESSIBLE'
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
