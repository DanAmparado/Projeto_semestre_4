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