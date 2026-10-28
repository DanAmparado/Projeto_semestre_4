-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Cria linha em public.usuarios após signup em auth.users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nome_completo, cpf, data_nascimento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo', 'A preencher'),
    coalesce(new.raw_user_meta_data->>'cpf', new.id::text),
    coalesce((new.raw_user_meta_data->>'data_nascimento')::date, '1900-01-01'::date)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Aplica movimentação de estoque (entrada soma, saída subtrai)
create or replace function aplicar_movimentacao_estoque()
returns trigger as $$
declare
  v_delta integer;
begin
  if new.tipo_movimentacao = 'entrada' then
    v_delta := new.quantidade;
  else
    v_delta := -new.quantidade;
  end if;

  insert into estoque_sangue (hemocentro_id, tipo_sanguineo, quantidade_bolsas, updated_at)
  values (new.hemocentro_id, new.tipo_sanguineo, greatest(v_delta, 0), now())
  on conflict (hemocentro_id, tipo_sanguineo)
  do update set
    quantidade_bolsas = greatest(estoque_sangue.quantidade_bolsas + v_delta, 0),
    updated_at = now();

  return new;
end;
$$ language plpgsql;

-- Gera alerta de ambiente fora da faixa
create or replace function verificar_ambiente_e_alertar()
returns trigger as $$
declare
  v_hemocentro_id uuid;
  v_temp_min constant numeric := 2.0;
  v_temp_max constant numeric := 6.0;
  v_umid_min constant numeric := 50.0;
  v_umid_max constant numeric := 80.0;
begin
  select hemocentro_id into v_hemocentro_id
  from sensores where id = new.sensor_id;

  if v_hemocentro_id is null then
    return new;
  end if;

  if new.temperatura is not null and (new.temperatura < v_temp_min or new.temperatura > v_temp_max) then
    update leituras_ambiente set alerta = true where id = new.id;
    insert into alertas (hemocentro_id, tipo, severidade, mensagem, referencia_id)
    values (
      v_hemocentro_id,
      case when new.temperatura > v_temp_max then 'temperatura_alta' else 'temperatura_baixa' end,
      'critico',
      format('Temperatura fora da faixa: %s°C (esperado %s-%s°C)', new.temperatura, v_temp_min, v_temp_max),
      new.sensor_id
    );
  end if;

  if new.umidade is not null and (new.umidade < v_umid_min or new.umidade > v_umid_max) then
    update leituras_ambiente set alerta = true where id = new.id;
    insert into alertas (hemocentro_id, tipo, severidade, mensagem, referencia_id)
    values (
      v_hemocentro_id,
      case when new.umidade > v_umid_max then 'umidade_alta' else 'umidade_baixa' end,
      'aviso',
      format('Umidade fora da faixa: %s%% (esperado %s-%s%%)', new.umidade, v_umid_min, v_umid_max),
      new.sensor_id
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Gera/resolve alertas de estoque baixo/crítico
create or replace function check_estoque_alerta()
returns trigger as $$
declare
  v_sev text;
  v_tipo text;
  v_msg text;
begin
  if new.quantidade_bolsas <= new.nivel_critico then
    v_sev := 'critico';
    v_tipo := 'estoque_critico';
    v_msg := format('Estoque CRÍTICO de %s: %s bolsas (crítico ≤ %s)',
                    new.tipo_sanguineo, new.quantidade_bolsas, new.nivel_critico);
  elsif new.quantidade_bolsas <= new.nivel_minimo then
    v_sev := 'aviso';
    v_tipo := 'estoque_baixo';
    v_msg := format('Estoque baixo de %s: %s bolsas (mínimo %s)',
                    new.tipo_sanguineo, new.quantidade_bolsas, new.nivel_minimo);
  else
    update alertas
       set resolvido = true, resolvido_em = now()
     where hemocentro_id = new.hemocentro_id
       and tipo in ('estoque_baixo','estoque_critico')
       and referencia_id = new.id
       and resolvido = false;
    return new;
  end if;

  if not exists (
    select 1 from alertas
    where hemocentro_id = new.hemocentro_id
      and tipo = v_tipo
      and referencia_id = new.id
      and resolvido = false
  ) then
    insert into alertas (hemocentro_id, tipo, severidade, mensagem, referencia_id)
    values (new.hemocentro_id, v_tipo, v_sev, v_msg, new.id);
  end if;

  return new;
end;
$$ language plpgsql;

-- Processa leitura de balança e gera movimentação
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
  v_bolsa_kg constant numeric := 0.45;
  v_leituras_id bigint;
begin
  select hemocentro_id, tipo_sanguineo_monitorado
    into v_hemocentro_id, v_tipo_sanguineo
  from sensores
  where id = p_sensor_id and tipo in ('balanca','combinado');

  if v_hemocentro_id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sensor não encontrado ou não é balança');
  end if;

  if p_peso_kg < 0 then
    return jsonb_build_object('ok', false, 'erro', 'Peso inválido');
  end if;

  select peso_kg into v_peso_anterior
  from leituras_balanca
  where sensor_id = p_sensor_id
  order by created_at desc
  limit 1;

  insert into leituras_balanca (sensor_id, tipo_sanguineo, peso_kg)
  values (p_sensor_id, v_tipo_sanguineo, p_peso_kg)
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
      'leitura_id', v_leituras_id
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