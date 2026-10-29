// Guia 2.1: supabase-js entra via CDN (<script> em cada página), expõe window.supabase
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_PUBLISHABLE_KEY = '<sb_publishable_...>'; // pegar no `supabase start`

// Nunca use a chave Secret (sb_secret_...) aqui. Só a Publishable.
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
