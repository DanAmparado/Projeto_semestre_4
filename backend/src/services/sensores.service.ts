import { supabaseAdmin } from '../lib/supabase';
import { Internal, NotFound } from '../errors/httpErrors';

type LeituraAmbienteRow = {
  id: number;
  created_at: string;
  temperatura: number | null;
  umidade: number | null;
  alerta: boolean;
};

export async function listarLeiturasAmbiente(
  hemocentroId: string,
  sensorId: string,
  limit: number
): Promise<LeituraAmbienteRow[]> {
  const { data: sensor, error: sensorError } = await supabaseAdmin
    .from('sensores')
    .select('id, hemocentro_id, tipo')
    .eq('id', sensorId)
    .maybeSingle();

  if (sensorError) throw Internal(sensorError.message);
  if (!sensor) throw NotFound('Sensor não encontrado');
  if (sensor.hemocentro_id !== hemocentroId) {
    throw NotFound('Sensor não pertence a este hemocentro');
  }
  if (sensor.tipo !== 'ambiente') {
    throw NotFound('Sensor não é do tipo ambiente');
  }

  const { data, error } = await supabaseAdmin
    .from('leituras_ambiente')
    .select('id, created_at, temperatura, umidade, alerta')
    .eq('sensor_id', sensorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw Internal(error.message);
  return (data ?? []) as LeituraAmbienteRow[];
}