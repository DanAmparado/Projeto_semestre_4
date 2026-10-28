import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Cliente administrativo — ignora RLS.
 * Usar APENAS no servidor, para operações administrativas:
 * ingestão IoT, relatórios, campanhas, resolução de alertas.
 * NUNCA expor ao front ou mobile.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Cliente de autenticação — usa a anon key.
 * Usado apenas para validar JWTs de usuários (auth.getUser).
 */
export const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});