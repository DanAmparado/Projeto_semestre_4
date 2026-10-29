import { supabaseAdmin } from '../lib/supabase';
import { BadRequest, Internal } from '../errors/httpErrors';
import { RegistrarDoacaoBody } from '../schemas/doacoes.schema';

type ResultadoRegistrarDoacao = {
  id: string;
  data_doacao: string;
  proxima_doacao_permitida: string;
  movimentacao_id: string;
};

export async function registrarDoacao(
  hemocentroId: string,
  funcionarioId: string,
  body: RegistrarDoacaoBody
): Promise<ResultadoRegistrarDoacao> {
  const { data, error } = await supabaseAdmin.rpc('registrar_doacao', {
    p_usuario_id: body.usuario_id,
    p_hemocentro_id: hemocentroId,
    p_tipo_sanguineo: body.tipo_sanguineo,
    p_peso: body.peso ?? null,
    p_funcionario_id: funcionarioId,
    p_observacao: body.observacao ?? null,
  });

  if (error) throw Internal(error.message);

  if (data && typeof data === 'object' && 'ok' in data && (data as any).ok === false) {
    const motivo = String((data as any).erro ?? 'Erro ao registrar doação');
    throw BadRequest(motivo);
  }

  const resultado = data as any;
  return {
    id: resultado.id,
    data_doacao: resultado.data_doacao,
    proxima_doacao_permitida: resultado.proxima_doacao_permitida,
    movimentacao_id: resultado.movimentacao_id,
  };
}