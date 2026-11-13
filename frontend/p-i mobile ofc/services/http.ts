import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const TIMEOUT_MS = 15000;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Não autenticado. Faça login novamente.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 204) return null as T;

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = body?.erro?.mensagem ?? `Erro ${res.status}`;
      throw new Error(msg);
    }

    return body as T;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('Servidor demorou para responder. Verifique sua conexão.');
    }
    throw e;
  }
}