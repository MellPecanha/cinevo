import { z } from 'zod';

export const createRoomSchema = z.object({
  number: z
    .number()
    .int('Número da sala deve ser inteiro')
    .positive('Número da sala deve ser maior que zero'),

  type: z.enum([
    'STANDARD',
    'VIP',
  ]),

  cinemaId: z
    .number()
    .int()
    .positive(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
