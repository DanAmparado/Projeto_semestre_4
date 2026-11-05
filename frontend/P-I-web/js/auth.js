import { USAR_MOCK } from './config.js';
import { supabase } from './supabase.js';

// Guia 2.3: login direto no Supabase Auth
export async function entrar(email, senha) {
  if (USAR_MOCK) { sessionStorage.setItem('ns_mock', '1'); return 'mock'; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(error.message);
  return data.session.access_token;
}

// Guia 2.4, passo 1: cria conta no Supabase Auth
export async function cadastrar(email, senha) {
  if (USAR_MOCK) return 'mock';
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Cadastro criado, mas sem sessão. Verifique se a confirmação de e-mail está desativada no Supabase.');
  return data.session.access_token;
}

export async function sessaoAtiva() {
  if (USAR_MOCK) return !!sessionStorage.getItem('ns_mock');
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function sair() {
  if (USAR_MOCK) sessionStorage.removeItem('ns_mock');
  else await supabase.auth.signOut();
}
