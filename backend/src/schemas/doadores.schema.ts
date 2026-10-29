import { z } from 'zod';

export const buscarDoadorParamsSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
});

export const buscarDoadorQuerySchema = z.object({
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos numéricos'),
});

export type BuscarDoadorQuery = z.infer<typeof buscarDoadorQuerySchema>;