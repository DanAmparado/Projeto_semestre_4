import { API_URL, USAR_MOCK } from './config.js';
import { supabase } from './supabase.js';
import { mock } from './mock.js';

// Guia 3: helper único para todas as chamadas à API (injeta token e lê { erro: { codigo, mensagem } })
export async function apiFetch(path, options = {}) {
  if (USAR_MOCK) return mock(path, options);

  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    }),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.erro?.mensagem ?? 'Erro inesperado';
    const err = new Error(msg);
    err.codigo = body?.erro?.codigo;
    err.detalhes = body?.erro?.detalhes;
    throw err;
  }

  return body;
}
