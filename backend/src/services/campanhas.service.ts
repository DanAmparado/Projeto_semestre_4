import { supabaseAdmin } from '../lib/supabase';
import { BadRequest, Internal } from '../errors/httpErrors';
import { CriarCampanhaBody } from '../schemas/campanhas.schema';

type CampanhaResultado = {
  id: string;
  tipo_sanguineo: string;
  titulo: string;
  canal: string;
  total_notificados: number;
};

export async function criarCampanha(
  hemocentroId: string,
  body: CriarCampanhaBody
): Promise<CampanhaResultado> {
  const { data, error } = await supabaseAdmin.rpc('criar_campanha', {
    p_hemocentro_id: hemocentroId,
    p_tipo_sanguineo: body.tipo_sanguineo,
    p_titulo: body.titulo,
    p_mensagem: body.mensagem,
    p_canal: body.canal,
  });

  if (error) throw Internal(error.message);

  if (data && typeof data === 'object' && 'ok' in data && (data as any).ok === false) {
    throw BadRequest(String((data as any).erro ?? 'Erro ao criar campanha'));
  }

  const r = data as any;
  return {
    id: r.id,
    tipo_sanguineo: r.tipo_sanguineo,
    titulo: r.titulo,
    canal: r.canal,
    total_notificados: r.total_notificados,
  };
}

export async function listarNotificacoesAdmin(hemocentroId: string, limit: number) {
  // Notificações enviadas pelo hemocentro = notificações vinculadas a campanhas dele
  const { data: campanhas, error: cError } = await supabaseAdmin
    .from('campanhas')
    .select('id')
    .eq('hemocentro_id', hemocentroId);

  if (cError) throw Internal(cError.message);
  const campanhaIds = (campanhas ?? []).map((c) => c.id);

  if (campanhaIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('notificacoes')
    .select('id, usuario_id, tipo, titulo, mensagem, canal, lida, enviada, referencia_id, created_at')
    .in('referencia_id', campanhaIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw Internal(error.message);
  return data ?? [];
}