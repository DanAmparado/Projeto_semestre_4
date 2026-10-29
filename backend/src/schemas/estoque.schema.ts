import { z } from 'zod';

export const hemocentroIdParamSchema = z.object({
  id: z.string().uuid('ID do hemocentro deve ser um UUID válido'),
});

export const alertaIdParamSchema = z.object({
  id: z.string().uuid('ID do alerta deve ser um UUID válido'),
});

export const listarAlertasQuerySchema = z.object({
  resolvido: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const criarMovimentacaoBodySchema = z.object({
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  tipo_movimentacao: z.enum(['entrada', 'saida']),
  origem: z.enum(['doacao', 'transfusao', 'descarte', 'ajuste_manual']),
  quantidade: z.number().int().min(1, 'Quantidade deve ser ≥ 1'),
  observacao: z.string().max(500).optional(),
});

export const listarMovimentacoesQuerySchema = z.object({
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  origem: z.enum(['doacao', 'transfusao', 'descarte', 'ajuste_manual', 'iot_balanca']).optional(),
  inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'inicio deve ser YYYY-MM-DD')
    .optional(),
  fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fim deve ser YYYY-MM-DD')
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});