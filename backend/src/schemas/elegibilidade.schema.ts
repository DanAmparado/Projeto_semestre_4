import { z } from 'zod';

export const elegibilidadeBodySchema = z.object({
  idade: z.number().int().min(16).max(100),
  peso: z.number().min(30).max(300),
  sexo: z.enum(['M', 'F', 'O']),
  ultima_doacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD')
    .optional()
    .nullable(),
  gripado_febre: z.boolean(),
  tatuagem_ultimos_12_meses: z.boolean(),
  hepatite_hiv: z.boolean(),
  gravida_amamentando: z.boolean().default(false),
  alcool_ultimas_12h: z.boolean().default(false),
  drogas_ilicitas: z.boolean().default(false),
  cirurgia_ultimos_6_meses: z.boolean().default(false),
});

export type ElegibilidadeBody = z.infer<typeof elegibilidadeBodySchema>;