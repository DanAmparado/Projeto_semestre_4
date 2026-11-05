const SUPABASE_URL = 'https://qspukyphnexyrhltabel.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_n-RuEpTqOjMWSRpmuWMi4w_w_0jf8Ns';

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);