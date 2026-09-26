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

  price: z
    .number()
    .positive('O preço da sessão deve ser maior que zero')
    .max(10000, 'O preço da sessão é inválido')
    .multipleOf(0.01, 'O preço deve ter no máximo duas casas decimais'),
});

export type CreateSessionInput =
  z.infer<typeof createSessionSchema>;
