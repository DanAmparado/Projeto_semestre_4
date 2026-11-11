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

export const criarDoadorBodySchema = z.object({
  nome_completo: z.string().min(1).max(200),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  sexo: z.enum(['M', 'F', 'O']),
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  telefone: z.string().max(20),
  email: z.string().email(),
  peso: z.number().min(30).max(300).optional(),
});

export type CriarDoadorBody = z.infer<typeof criarDoadorBodySchema>;