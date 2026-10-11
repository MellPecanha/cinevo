import { z } from 'zod';

export const generateSeatsSchema = z.object({
  rowSeats: z
    .array(z.number().int('Quantidade de assentos deve ser inteira').min(1, 'A fileira deve possuir pelo menos um assento').max(50, 'A fileira pode possuir no máximo 50 assentos'))
    .min(1, 'A sala deve possuir pelo menos uma fileira')
    .max(26, 'A sala pode possuir no máximo 26 fileiras')
    .optional(),

  rows: z
    .number()
    .int('Quantidade de fileiras deve ser inteira')
    .min(1, 'A sala deve possuir pelo menos uma fileira')
    .max(26, 'A sala pode possuir no máximo 26 fileiras')
    .optional(),

  seatsPerRow: z
    .number()
    .int('Quantidade de assentos deve ser inteira')
    .min(1, 'A fileira deve possuir pelo menos um assento')
    .max(50, 'A fileira pode possuir no máximo 50 assentos')
    .optional(),

  accessibleSeats: z
    .array(z.string().regex(
      /^[A-Z]\d{2}$/,
      'Assento deve seguir o formato A01',
    ))
    .default([]),

  vipSeats: z
    .array(z.string().regex(
      /^[A-Z]\d{2}$/,
      'Assento deve seguir o formato A01',
    ))
    .default([]),
}).superRefine((data, context) => {
  if (!data.rowSeats && (!data.rows || !data.seatsPerRow)) {
    context.addIssue({ code: 'custom', path: ['rowSeats'], message: 'Informe a quantidade de assentos de cada fileira' });
  }

  const accessibleSeatSet = new Set(data.accessibleSeats);
  const duplicatedSeat = data.vipSeats.find((seat) => accessibleSeatSet.has(seat));

  if (duplicatedSeat) {
    context.addIssue({
      code: 'custom',
      path: ['vipSeats'],
      message: `O assento ${duplicatedSeat} não pode ser VIP e acessível ao mesmo tempo`,
    });
  }

  const seatsByRow = data.rowSeats ?? Array.from({ length: data.rows ?? 0 }, () => data.seatsPerRow ?? 0);
  const isSeatInLayout = (seat: string) => {
    const rowIndex = seat.charCodeAt(0) - 65;
    const seatNumber = Number(seat.slice(1));
    return rowIndex >= 0 && rowIndex < seatsByRow.length && seatNumber >= 1 && seatNumber <= seatsByRow[rowIndex];
  };

  for (const seat of [...data.accessibleSeats, ...data.vipSeats]) {
    if (!isSeatInLayout(seat)) {
      context.addIssue({ code: 'custom', path: ['rowSeats'], message: `O assento ${seat} não existe na planta informada` });
    }
  }
}).transform((data) => ({
  ...data,
  rowSeats: data.rowSeats ?? Array.from({ length: data.rows ?? 0 }, () => data.seatsPerRow ?? 0),
}));

export type GenerateSeatsInput =
  z.infer<typeof generateSeatsSchema>;

export const setSeatAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type SetSeatAvailabilityInput = z.infer<typeof setSeatAvailabilitySchema>;
