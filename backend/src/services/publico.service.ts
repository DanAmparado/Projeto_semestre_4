import { supabaseAdmin } from '../lib/supabase';
import { Internal, NotFound } from '../errors/httpErrors';

type HemocentroRow = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
  telefone: string | null;
  email: string | null;
};

type EstoqueItem = {
  tipo_sanguineo: string;
  quantidade_bolsas: number;
  nivel_minimo: number;
  nivel_critico: number;
  updated_at: string;
};

export async function listarHemocentros(filtros: { cidade?: string; estado?: string }) {
  let query = supabaseAdmin
    .from('hemocentros')
    .select('id, nome, cidade, estado, latitude, longitude, telefone, email')
    .eq('ativo', true)
    .order('nome');

  if (filtros.cidade) query = query.ilike('cidade', filtros.cidade);
  if (filtros.estado) query = query.eq('estado', filtros.estado);

  const { data, error } = await query;
  if (error) throw Internal(error.message);
  return (data ?? []) as HemocentroRow[];
}

export async function getEstoqueHemocentro(hemocentroId: string): Promise<EstoqueItem[]> {
  const { data: hemocentro, error: hError } = await supabaseAdmin
    .from('hemocentros')
    .select('id')
    .eq('id', hemocentroId)
    .eq('ativo', true)
    .maybeSingle();

  if (hError) throw Internal(hError.message);
  if (!hemocentro) throw NotFound('Hemocentro não encontrado');

  const { data, error } = await supabaseAdmin
    .from('estoque_sangue')
    .select('tipo_sanguineo, quantidade_bolsas, nivel_minimo, nivel_critico, updated_at')
    .eq('hemocentro_id', hemocentroId)
    .order('tipo_sanguineo');

  if (error) throw Internal(error.message);
  return (data ?? []) as EstoqueItem[];
}

export async function listarEstoqueAgregado(filtros: { cidade: string; estado?: string }) {
  const hemocentros = await listarHemocentros({
    cidade: filtros.cidade,
    estado: filtros.estado,
  });

  if (hemocentros.length === 0) return [];

  const ids = hemocentros.map((h) => h.id);

  const { data: estoques, error } = await supabaseAdmin
    .from('estoque_sangue')
    .select('hemocentro_id, tipo_sanguineo, quantidade_bolsas, nivel_minimo, nivel_critico, updated_at')
    .in('hemocentro_id', ids)
    .order('tipo_sanguineo');

  if (error) throw Internal(error.message);

  const porHemocentro = new Map<string, EstoqueItem[]>();
  for (const item of estoques ?? []) {
    const arr = porHemocentro.get(item.hemocentro_id) ?? [];
    arr.push({
      tipo_sanguineo: item.tipo_sanguineo,
      quantidade_bolsas: item.quantidade_bolsas,
      nivel_minimo: item.nivel_minimo,
      nivel_critico: item.nivel_critico,
      updated_at: item.updated_at,
    });
    porHemocentro.set(item.hemocentro_id, arr);
  }

  return hemocentros.map((h) => ({
    hemocentro: {
      id: h.id,
      nome: h.nome,
      cidade: h.cidade,
      estado: h.estado,
      telefone: h.telefone,
    },
    estoque: porHemocentro.get(h.id) ?? [],
  }));
}