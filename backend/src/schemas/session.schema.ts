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

  price: z
    .number()
    .positive('O preço da sessão deve ser maior que zero')
    .max(10000, 'O preço da sessão é inválido')
    .multipleOf(0.01, 'O preço deve ter no máximo duas casas decimais'),

  recurrenceDays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .optional(),

  recurrenceUntil: z
    .string()
    .datetime({ offset: true })
    .optional(),
}).superRefine((data, context) => {
  if ((data.recurrenceDays?.length ?? 0) > 0 && !data.recurrenceUntil) {
    context.addIssue({ code: 'custom', path: ['recurrenceUntil'], message: 'Informe até quando repetir a sessão' });
  }

  if (data.recurrenceUntil && (data.recurrenceDays?.length ?? 0) === 0) {
    context.addIssue({ code: 'custom', path: ['recurrenceDays'], message: 'Selecione ao menos um dia da semana' });
  }
});

export type CreateSessionInput =
  z.infer<typeof createSessionSchema>;
