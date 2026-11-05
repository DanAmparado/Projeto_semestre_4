import { z } from 'zod';

const tipoSanguineoEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD')
  .refine(
    (v) => !Number.isNaN(Date.parse(v)),
    'Data inválida'
  );

export const relatorioParamsSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
});

export const previsaoQuerySchema = z.object({
  tipo_sanguineo: tipoSanguineoEnum,
  semanas: z.coerce.number().int().min(4).max(104).default(52),
  horizonte: z.coerce.number().int().min(1).max(12).default(4),
});

export const periodoQuerySchema = z.object({
  inicio: dataISO,
  fim: dataISO,
}).refine((d) => d.inicio <= d.fim, {
  message: 'inicio deve ser anterior ou igual a fim',
  path: ['inicio'],
});

export const cepQuerySchema = z.object({
  sensor_id: z.string().uuid('sensor_id deve ser um UUID válido'),
  inicio: dataISO,
  fim: dataISO,
}).refine((d) => d.inicio <= d.fim, {
  message: 'inicio deve ser anterior ou igual a fim',
  path: ['inicio'],
});