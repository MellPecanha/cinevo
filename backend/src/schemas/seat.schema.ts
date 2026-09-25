import { z } from 'zod';

export const generateSeatsSchema = z.object({
  rows: z
    .number()
    .int('Quantidade de fileiras deve ser inteira')
    .min(1, 'A sala deve possuir pelo menos uma fileira')
    .max(26, 'A sala pode possuir no máximo 26 fileiras'),

  seatsPerRow: z
    .number()
    .int('Quantidade de assentos deve ser inteira')
    .min(1, 'A fileira deve possuir pelo menos um assento')
    .max(50, 'A fileira pode possuir no máximo 50 assentos'),

  accessibleSeats: z
    .array(z.string().regex(
      /^[A-Z]\d{2}$/,
      'Assento deve seguir o formato A01',
    ))
    .default([]),
});

export type GenerateSeatsInput =
  z.infer<typeof generateSeatsSchema>;
