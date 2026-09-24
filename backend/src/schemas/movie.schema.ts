import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),

  description: z
    .string()
    .trim()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional(),

  duration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .positive('Duração deve ser maior que zero'),

  classification: z.enum([
    'L',
    'AGE_10',
    'AGE_12',
    'AGE_14',
    'AGE_16',
    'AGE_18',
  ]),

  coverUrl: z
    .string()
    .url('URL da capa inválida')
    .optional(),

  trailerUrl: z
    .string()
    .url('URL do trailer inválida')
    .optional(),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
