import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve possuir pelo menos 2 caracteres')
    .max(150, 'Nome deve possuir no máximo 150 caracteres'),

  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .transform((email) => email.toLowerCase()),

  phone: z
    .string()
    .trim()
    .min(10, 'Telefone inválido')
    .max(20, 'Telefone inválido')
    .optional(),

  password: z
    .string()
    .min(8, 'A senha deve possuir pelo menos 8 caracteres')
    .max(100, 'A senha deve possuir no máximo 100 caracteres'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
