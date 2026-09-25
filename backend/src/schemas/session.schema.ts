import { z } from 'zod';

export const createSessionSchema = z.object({
  movieId: z
    .number()
    .int('Filme inválido')
    .positive('Filme inválido'),

  roomId: z
    .number()
    .int('Sala inválida')
    .positive('Sala inválida'),

  startsAt: z
    .string()
    .datetime({
      offset: true,
    }),

  endsAt: z
    .string()
    .datetime({
      offset: true,
    }),
});

export type CreateSessionInput =
  z.infer<typeof createSessionSchema>;
