import { supabaseAdmin } from '../lib/supabase';
import { Forbidden, Internal, NotFound } from '../errors/httpErrors';

export async function getEstoqueInterno(hemocentroId: string) {
  const { data, error } = await supabaseAdmin
    .from('estoque_sangue')
    .select('tipo_sanguineo, quantidade_bolsas, nivel_minimo, nivel_critico, updated_at')
    .eq('hemocentro_id', hemocentroId)
    .order('tipo_sanguineo');

  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function listarAlertas(hemocentroId: string, resolvido?: boolean) {
  let query = supabaseAdmin
    .from('alertas')
    .select('id, tipo, severidade, mensagem, resolvido, created_at, resolvido_em, resolvido_por')
    .eq('hemocentro_id', hemocentroId)
    .order('created_at', { ascending: false });

  if (resolvido !== undefined) query = query.eq('resolvido', resolvido);

  const { data, error } = await query;
  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function resolverAlerta(alertaId: string, funcionarioId: string) {
  const { data: alerta, error: aError } = await supabaseAdmin
    .from('alertas')
    .select('id, hemocentro_id, resolvido')
    .eq('id', alertaId)
    .maybeSingle();

  if (aError) throw Internal(aError.message);
  if (!alerta) throw NotFound('Alerta não encontrado');
  if (alerta.resolvido) return;

  const { data: vinculo, error: vError } = await supabaseAdmin
    .from('hemocentro_usuarios')
    .select('id')
    .eq('user_id', funcionarioId)
    .eq('hemocentro_id', alerta.hemocentro_id)
    .eq('ativo', true)
    .maybeSingle();

  if (vError) throw Internal(vError.message);
  if (!vinculo) throw Forbidden('Sem acesso a este hemocentro');

  const { error: updateError } = await supabaseAdmin
    .from('alertas')
    .update({
      resolvido: true,
      resolvido_em: new Date().toISOString(),
      resolvido_por: funcionarioId,
    })
    .eq('id', alertaId);

  if (updateError) throw Internal(updateError.message);
}

type MovimentacaoInput = {
  tipo_sanguineo: string;
  tipo_movimentacao: 'entrada' | 'saida';
  origem: 'doacao' | 'transfusao' | 'descarte' | 'ajuste_manual';
  quantidade: number;
  observacao?: string;
};

export async function criarMovimentacao(
  hemocentroId: string,
  funcionarioId: string,
  body: MovimentacaoInput
) {
  const { data, error } = await supabaseAdmin
    .from('movimentacoes_estoque')
    .insert({
      hemocentro_id: hemocentroId,
      tipo_sanguineo: body.tipo_sanguineo,
      tipo_movimentacao: body.tipo_movimentacao,
      origem: body.origem,
      quantidade: body.quantidade,
      observacao: body.observacao ?? null,
      funcionario_id: funcionarioId,
    })
    .select('id, tipo_sanguineo, tipo_movimentacao, origem, quantidade, created_at')
    .single();

  if (error) throw Internal(error.message);
  return data;
}

type FiltrosMovimentacoes = {
  tipo_sanguineo?: string;
  origem?: string;
  inicio?: string;
  fim?: string;
  limit: number;
};

export async function listarMovimentacoes(
  hemocentroId: string,
  filtros: FiltrosMovimentacoes
) {
  let query = supabaseAdmin
    .from('movimentacoes_estoque')
    .select(
      'id, tipo_sanguineo, tipo_movimentacao, origem, quantidade, observacao, doacao_id, sensor_id, created_at'
    )
    .eq('hemocentro_id', hemocentroId)
    .order('created_at', { ascending: false })
    .limit(filtros.limit);

  if (filtros.tipo_sanguineo) query = query.eq('tipo_sanguineo', filtros.tipo_sanguineo);
  if (filtros.origem) query = query.eq('origem', filtros.origem);
  if (filtros.inicio) query = query.gte('created_at', filtros.inicio);
  if (filtros.fim) query = query.lte('created_at', `${filtros.fim}T23:59:59.999Z`);

  const { data, error } = await query;
  if (error) throw Internal(error.message);
  return data ?? [];
}