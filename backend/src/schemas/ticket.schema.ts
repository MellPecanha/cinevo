import { z } from 'zod';

export const validateTicketSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Código do ingresso é obrigatório')
    .max(100, 'Código do ingresso é inválido'),
});

export type ValidateTicketInput =
  z.infer<typeof validateTicketSchema>;
