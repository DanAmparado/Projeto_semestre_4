import { z } from 'zod';

export const criarSensorBodySchema = z.object({
  nome: z.string().min(1).max(100),
  tipo: z.enum(['balanca', 'ambiente', 'camera', 'combinado']),
  device_id: z.string().min(1).max(100),
  localizacao: z.string().max(100).optional(),
  tipo_sanguineo_monitorado: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  modelo: z.string().max(100).optional(),
  versao_firmware: z.string().max(50).optional(),
});

export const atualizarSensorBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  localizacao: z.string().max(100).optional(),
  status: z.enum(['ativo', 'inativo', 'manutencao']).optional(),
  modelo: z.string().max(100).optional(),
  versao_firmware: z.string().max(50).optional(),
});

export const sensorIdParamSchema = z.object({
  id: z.string().uuid('ID do sensor deve ser um UUID válido'),
});

export type CriarSensorBody = z.infer<typeof criarSensorBodySchema>;
export type AtualizarSensorBody = z.infer<typeof atualizarSensorBodySchema>;