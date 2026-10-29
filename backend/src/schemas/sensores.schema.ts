import { z } from 'zod';

export const leiturasParamsSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
  sensorId: z.string().uuid('ID do sensor deve ser um UUID válido'),
});

export const listarLeiturasQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export type ListarLeiturasQuery = z.infer<typeof listarLeiturasQuerySchema>;