import { z } from 'zod';

export const criarCampanhaBodySchema = z.object({
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  titulo: z.string().min(1, 'Título obrigatório').max(100, 'Título muito longo'),
  mensagem: z.string().min(1, 'Mensagem obrigatória').max(500, 'Mensagem muito longa'),
  canal: z.enum(['app', 'sms', 'email', 'push']).default('app'),
});

export const listarNotificacoesAdminQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CriarCampanhaBody = z.infer<typeof criarCampanhaBodySchema>;