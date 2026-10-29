import { z } from 'zod';

export const atualizarPerfilBodySchema = z.object({
  nome_completo: z.string().min(1).max(200).optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD')
    .optional(),
  sexo: z.enum(['M', 'F', 'O']).optional(),
  tipo_sanguineo: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  telefone: z.string().max(20).optional(),
  peso: z.number().min(30).max(300).optional(),
  aceita_notificacoes_sms: z.boolean().optional(),
});

export const notificacaoIdParamSchema = z.object({
  id: z.string().uuid('ID da notificação deve ser um UUID válido'),
});

export type AtualizarPerfilBody = z.infer<typeof atualizarPerfilBodySchema>;