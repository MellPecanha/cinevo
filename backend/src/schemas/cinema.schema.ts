import { z } from 'zod';

export const createCinemaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),

  address: z
    .string()
    .trim()
    .min(1, 'Endereço é obrigatório')
    .max(250, 'Endereço deve ter no máximo 250 caracteres'),

  city: z
    .string()
    .trim()
    .min(1, 'Cidade é obrigatória')
    .max(100, 'Cidade deve ter no máximo 100 caracteres'),

  state: z
    .string()
    .trim()
    .length(2, 'Estado deve possuir 2 caracteres')
    .toUpperCase(),
});

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
