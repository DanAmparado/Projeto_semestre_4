import { supabaseAdmin } from '../lib/supabase';
import { Internal, NotFound } from '../errors/httpErrors';

type DoadorResumo = {
  id: string;
  nome_completo: string;
  tipo_sanguineo: string | null;
  total_doacoes: number;
  ultima_doacao: string | null;
};

export async function buscarDoadorPorCpf(cpf: string): Promise<DoadorResumo> {
  const { data: doador, error: doadorError } = await supabaseAdmin
    .from('usuarios')
    .select('id, nome_completo, tipo_sanguineo, total_doacoes')
    .eq('cpf', cpf)
    .maybeSingle();

  if (doadorError) throw Internal(doadorError.message);
  if (!doador) throw NotFound('Doador não encontrado');

  const { data: ultima, error: doacoesError } = await supabaseAdmin
    .from('doacoes')
    .select('data_doacao')
    .eq('usuario_id', doador.id)
    .eq('status', 'realizada')
    .order('data_doacao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (doacoesError) throw Internal(doacoesError.message);

  return {
    id: doador.id,
    nome_completo: doador.nome_completo,
    tipo_sanguineo: doador.tipo_sanguineo,
    total_doacoes: doador.total_doacoes ?? 0,
    ultima_doacao: ultima?.data_doacao ?? null,
  };
}