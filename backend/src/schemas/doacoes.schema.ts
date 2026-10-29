import { z } from 'zod';

export const registrarDoacaoParamsSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
});

export const registrarDoacaoBodySchema = z.object({
  usuario_id: z.string().uuid('usuario_id deve ser um UUID válido'),
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Tipo sanguíneo inválido' }),
  }),
  peso: z
    .number()
    .min(50, 'Peso mínimo para doação é 50 kg')
    .max(200, 'Peso máximo aceito é 200 kg')
    .optional(),
  observacao: z.string().max(500, 'Observação muito longa').optional(),
});

export type RegistrarDoacaoBody = z.infer<typeof registrarDoacaoBodySchema>;