create or replace function processar_leitura_balanca(
  p_sensor_id uuid,
  p_peso_kg numeric
) returns jsonb as $$
declare
  v_hemocentro_id uuid;
  v_tipo_sanguineo text;
  v_peso_anterior numeric;
  v_delta_peso numeric;
  v_delta_bolsas integer;
  v_bolsa_kg constant numeric := 0.640;
  v_max_bolsas_cacamba constant integer := 7;
  v_capacidade_fisica_kg constant numeric := 5.0;
  v_leituras_id bigint;
begin
  select hemocentro_id, tipo_sanguineo_monitorado
    into v_hemocentro_id, v_tipo_sanguineo
  from sensores
  where id = p_sensor_id and tipo in ('balanca', 'combinado');

  if v_hemocentro_id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sensor não encontrado ou não é balança');
  end if;

  if p_peso_kg < 0 then
    return jsonb_build_object('ok', false, 'erro', 'Peso inválido');
  end if;

  if p_peso_kg > v_capacidade_fisica_kg then
    return jsonb_build_object(
      'ok', false,
      'erro', format('Peso acima da capacidade física da balança (máx %s kg)', v_capacidade_fisica_kg)
    );
  end if;

  select peso_kg into v_peso_anterior
  from leituras_balanca
  where sensor_id = p_sensor_id
  order by created_at desc
  limit 1;

  insert into leituras_balanca (sensor_id, tipo_sanguineo, peso_kg, bolsas_estimadas)
  values (
    p_sensor_id, v_tipo_sanguineo, p_peso_kg,
    least(round(p_peso_kg / v_bolsa_kg)::int, v_max_bolsas_cacamba)
  )
  returning id into v_leituras_id;

  if v_peso_anterior is null then
    return jsonb_build_object('ok', true, 'primeira_leitura', true);
  end if;

  v_delta_peso := p_peso_kg - v_peso_anterior;

  if abs(v_delta_peso) < v_bolsa_kg * 0.7 then
    update sensores set ultima_comunicacao = now() where id = p_sensor_id;
    return jsonb_build_object('ok', true, 'movimentacao_detectada', false);
  end if;

  v_delta_bolsas := round(abs(v_delta_peso) / v_bolsa_kg);

  insert into movimentacoes_estoque (
    hemocentro_id, tipo_sanguineo, tipo_movimentacao,
    origem, quantidade, sensor_id, metadados
  ) values (
    v_hemocentro_id,
    v_tipo_sanguineo,
    case when v_delta_peso > 0 then 'entrada' else 'saida' end,
    'iot_balanca',
    v_delta_bolsas,
    p_sensor_id,
    jsonb_build_object(
      'peso_anterior_kg', v_peso_anterior,
      'peso_atual_kg', p_peso_kg,
      'delta_kg', v_delta_peso,
      'leitura_id', v_leituras_id,
      'limite_bolsas_aplicado', v_max_bolsas_cacamba
    )
  );

  update sensores set ultima_comunicacao = now() where id = p_sensor_id;

  return jsonb_build_object(
    'ok', true,
    'movimentacao_detectada', true,
    'tipo', case when v_delta_peso > 0 then 'entrada' else 'saida' end,
    'bolsas', v_delta_bolsas,
    'delta_peso_kg', v_delta_peso
  );
end;
$$ language plpgsql security definer;