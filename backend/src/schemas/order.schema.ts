import { z } from 'zod';

export const createOrderSchema = z.object({
  sessionId: z
    .number()
    .int()
    .positive(),

  tickets: z
    .array(
      z.object({
        seatId: z
          .number()
          .int()
          .positive(),

        type: z.enum([
          'FULL',
          'HALF',
        ]),
      }),
    )
    .min(1, 'Selecione pelo menos um assento')
    .max(
      10,
      'É permitido comprar no máximo 10 ingressos por pedido',
    ),
});

export type CreateOrderInput =
  z.infer<typeof createOrderSchema>;
