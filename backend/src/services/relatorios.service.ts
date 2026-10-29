import { supabaseAdmin } from '../lib/supabase';
import { Internal, NotFound } from '../errors/httpErrors';

export async function previsaoDemanda(
  hemocentroId: string,
  tipoSanguineo: string,
  semanas: number,
  horizonte: number
) {
  const { data, error } = await supabaseAdmin.rpc('previsao_demanda_sazonal', {
    p_hemocentro_id: hemocentroId,
    p_tipo_sanguineo: tipoSanguineo,
    p_semanas_historico: semanas,
    p_horizonte_semanas: horizonte,
  });

  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function mediaDoacoes(hemocentroId: string, inicio: string, fim: string) {
  const { data, error } = await supabaseAdmin.rpc('relatorio_media_doacoes', {
    p_hemocentro_id: hemocentroId,
    p_data_inicial: inicio,
    p_data_final: fim,
  });

  if (error) throw Internal(error.message);
  return data ?? { resumo: {}, distribuicao: [] };
}

export async function estudoDoadores(hemocentroId: string, inicio: string, fim: string) {
  const { data, error } = await supabaseAdmin.rpc('relatorio_estudo_doador', {
    p_hemocentro_id: hemocentroId,
    p_data_inicial: inicio,
    p_data_final: fim,
  });

  if (error) throw Internal(error.message);
  return data ?? { kpis: {}, faixas_etarias: [] };
}

export async function controleEstatistico(
  hemocentroId: string,
  sensorId: string,
  inicio: string,
  fim: string
) {
  const { data: sensor, error: sError } = await supabaseAdmin
    .from('sensores')
    .select('id, hemocentro_id, tipo')
    .eq('id', sensorId)
    .maybeSingle();

  if (sError) throw Internal(sError.message);
  if (!sensor) throw NotFound('Sensor não encontrado');
  if (sensor.hemocentro_id !== hemocentroId) {
    throw NotFound('Sensor não pertence a este hemocentro');
  }
  if (sensor.tipo !== 'ambiente') {
    throw NotFound('Sensor não é do tipo ambiente');
  }

  const { data, error } = await supabaseAdmin.rpc('relatorio_cep', {
    p_sensor_id: sensorId,
    p_data_inicial: inicio,
    p_data_final: fim,
  });

  if (error) throw Internal(error.message);
  return data ?? [];
}