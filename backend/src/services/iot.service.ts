import { supabaseAdmin } from '../lib/supabase';
import { BadRequest, Internal, NotFound } from '../errors/httpErrors';
import { AmbienteInput, BalancaInput } from '../schemas/iot.schema';

type SensorRow = {
  id: string;
  status: string;
  tipo: string;
};

async function buscarSensor(deviceId: string, tiposAceitos: string[]): Promise<SensorRow> {
  const { data, error } = await supabaseAdmin
    .from('sensores')
    .select('id, status, tipo')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) throw Internal(error.message);
  if (!data) throw NotFound(`Device "${deviceId}" não encontrado`);
  if (data.status !== 'ativo') throw NotFound(`Sensor "${deviceId}" não está ativo`);
  if (!tiposAceitos.includes(data.tipo)) {
    throw NotFound(`Sensor "${deviceId}" não é do tipo esperado`);
  }

  return data as SensorRow;
}

export async function registrarLeituraAmbiente(input: AmbienteInput) {
  const sensor = await buscarSensor(input.device_id, ['ambiente', 'combinado']);

  const { data: leitura, error: insertError } = await supabaseAdmin
    .from('leituras_ambiente')
    .insert({
      sensor_id: sensor.id,
      temperatura: input.temperatura,
      umidade: input.umidade,
    })
    .select('id')
    .single();

  if (insertError) throw Internal(insertError.message);

  await supabaseAdmin
    .from('sensores')
    .update({ ultima_comunicacao: new Date().toISOString() })
    .eq('id', sensor.id);

  return { ok: true, leitura_id: leitura.id };
}

export async function registrarLeituraBalanca(input: BalancaInput) {
  const sensor = await buscarSensor(input.device_id, ['balanca', 'combinado']);

  const { data, error } = await supabaseAdmin.rpc('processar_leitura_balanca', {
    p_sensor_id: sensor.id,
    p_peso_kg: input.peso_kg,
  });

  if (error) throw Internal(error.message);

  if (data && typeof data === 'object' && 'ok' in data && (data as any).ok === false) {
    const motivo = String((data as any).erro ?? 'Erro ao processar leitura');
    throw BadRequest(motivo);
  }

  return data;
}