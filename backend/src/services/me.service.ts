import { supabaseAdmin } from '../lib/supabase';
import { Conflict, Internal, NotFound } from '../errors/httpErrors';
import { AtualizarPerfilBody } from '../schemas/me.schema';

type PerfilResponse = {
  id: string;
  nome_completo: string;
  email: string | null;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
  tipo_sanguineo: string | null;
  telefone: string | null;
  peso: number | null;
  aceita_notificacoes_sms: boolean;
  total_doacoes: number;
  pontos: number;
  ultima_doacao: string | null;
};

export async function getPerfil(userId: string, authEmail?: string | null): Promise<PerfilResponse> {
  const { data: usuario, error } = await supabaseAdmin
    .from('usuarios')
    .select(
      'id, nome_completo, email, cpf, data_nascimento, sexo, tipo_sanguineo, telefone, peso, aceita_notificacoes_sms, total_doacoes, pontos'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) throw Internal(error.message);
  if (!usuario) throw NotFound('Perfil não encontrado');

  const { data: ultima } = await supabaseAdmin
    .from('doacoes')
    .select('data_doacao')
    .eq('usuario_id', userId)
    .eq('status', 'realizada')
    .order('data_doacao', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    id: usuario.id,
    nome_completo: usuario.nome_completo,
    email: usuario.email ?? authEmail ?? null,
    cpf: usuario.cpf,
    data_nascimento: usuario.data_nascimento,
    sexo: usuario.sexo,
    tipo_sanguineo: usuario.tipo_sanguineo,
    telefone: usuario.telefone,
    peso: usuario.peso,
    aceita_notificacoes_sms: usuario.aceita_notificacoes_sms,
    total_doacoes: usuario.total_doacoes ?? 0,
    pontos: usuario.pontos ?? 0,
    ultima_doacao: ultima?.data_doacao ?? null,
  };
}

export async function atualizarPerfil(userId: string, body: AtualizarPerfilBody): Promise<void> {
  const patch: Record<string, unknown> = {};

  for (const key of Object.keys(body) as (keyof AtualizarPerfilBody)[]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabaseAdmin.from('usuarios').update(patch).eq('id', userId);

  if (error) {
    if (error.code === '23505') {
      throw Conflict('CPF já cadastrado para outro usuário');
    }
    throw Internal(error.message);
  }
}

export async function listarDoacoes(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('doacoes')
    .select('id, tipo_sanguineo, data_doacao, status, hemocentro_id')
    .eq('usuario_id', userId)
    .order('data_doacao', { ascending: false });

  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function listarNotificacoes(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('notificacoes')
    .select('id, tipo, titulo, mensagem, canal, lida, created_at')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function marcarNotificacaoLida(userId: string, notificacaoId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('notificacoes')
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq('id', notificacaoId)
    .eq('usuario_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw Internal(error.message);
  if (!data) throw NotFound('Notificação não encontrada');
}