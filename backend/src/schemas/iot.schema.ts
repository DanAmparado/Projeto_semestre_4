import { z } from 'zod';

export const ambienteSchema = z.object({
  device_id: z.string().min(1, 'device_id é obrigatório'),
  temperatura: z
    .number()
    .min(-50, 'temperatura abaixo do mínimo físico')
    .max(50, 'temperatura acima do máximo físico'),
  umidade: z.number().min(0, 'umidade mínima é 0').max(100, 'umidade máxima é 100'),
});

export const balancaSchema = z.object({
  device_id: z.string().min(1, 'device_id é obrigatório'),
  peso_kg: z.number().min(0, 'peso não pode ser negativo'),
});

export type AmbienteInput = z.infer<typeof ambienteSchema>;
export type BalancaInput = z.infer<typeof balancaSchema>;