import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Helper único para falar com o back-end.
 * Injeta o token da sessão do Supabase e lê o erro no formato { erro: { codigo, mensagem } }.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (res.status === 204) return null as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.erro?.mensagem ?? 'Erro inesperado';
    throw new Error(msg);
  }

  return body as T;
}
