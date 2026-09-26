import { z } from 'zod';

export const assignCinemaAdminSchema = z.object({
  userId: z
    .number()
    .int('Usuário inválido')
    .positive('Usuário inválido'),
});

export type AssignCinemaAdminInput =
  z.infer<typeof assignCinemaAdminSchema>;
