import { supabaseAdmin } from '../lib/supabase';
import { Forbidden, Internal, NotFound } from '../errors/httpErrors';
import { AtualizarSensorBody, CriarSensorBody } from '../schemas/sensoresAdmin.schema';

export async function listarSensores(hemocentroId: string) {
  const { data, error } = await supabaseAdmin
    .from('sensores')
    .select(
      'id, nome, tipo, device_id, localizacao, tipo_sanguineo_monitorado, status, ultima_comunicacao, modelo, versao_firmware'
    )
    .eq('hemocentro_id', hemocentroId)
    .order('nome');

  if (error) throw Internal(error.message);
  return data ?? [];
}

export async function criarSensor(hemocentroId: string, body: CriarSensorBody) {
  const { data, error } = await supabaseAdmin
    .from('sensores')
    .insert({
      hemocentro_id: hemocentroId,
      nome: body.nome,
      tipo: body.tipo,
      device_id: body.device_id,
      localizacao: body.localizacao ?? null,
      tipo_sanguineo_monitorado: body.tipo_sanguineo_monitorado ?? null,
      modelo: body.modelo ?? null,
      versao_firmware: body.versao_firmware ?? null,
    })
    .select('id, nome, tipo, device_id, status')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw Internal('device_id já cadastrado');
    }
    throw Internal(error.message);
  }
  return data;
}

export async function atualizarSensor(
  sensorId: string,
  userId: string,
  body: AtualizarSensorBody
) {
  const { data: sensor, error: sError } = await supabaseAdmin
    .from('sensores')
    .select('id, hemocentro_id')
    .eq('id', sensorId)
    .maybeSingle();

  if (sError) throw Internal(sError.message);
  if (!sensor) throw NotFound('Sensor não encontrado');

  const { data: vinculo, error: vError } = await supabaseAdmin
    .from('hemocentro_usuarios')
    .select('id')
    .eq('user_id', userId)
    .eq('hemocentro_id', sensor.hemocentro_id)
    .eq('ativo', true)
    .maybeSingle();

  if (vError) throw Internal(vError.message);
  if (!vinculo) throw Forbidden('Sem acesso a este sensor');

  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(body) as (keyof AtualizarSensorBody)[]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabaseAdmin.from('sensores').update(patch).eq('id', sensorId);
  if (error) throw Internal(error.message);
}