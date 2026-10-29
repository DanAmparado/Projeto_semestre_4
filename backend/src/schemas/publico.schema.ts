import { z } from 'zod';

export const listarHemocentrosQuerySchema = z.object({
  cidade: z.string().min(1).max(100).optional(),
  estado: z
    .string()
    .length(2, 'Estado deve ter 2 letras (UF)')
    .toUpperCase()
    .optional(),
});

export const hemocentroIdParamSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
});

export const estoqueAgregadoQuerySchema = z.object({
  cidade: z.string().min(1).max(100),
  estado: z
    .string()
    .length(2, 'Estado deve ter 2 letras (UF)')
    .toUpperCase()
    .optional(),
});