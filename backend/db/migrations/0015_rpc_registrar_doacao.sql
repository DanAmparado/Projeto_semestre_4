-- Registra uma doação completa de forma atômica:
-- 1. Valida doador e hemocentro
-- 2. Insere em doacoes
-- 3. Insere em movimentacoes_estoque (trigger atualiza estoque_sangue)
-- 4. Atualiza total_doacoes e pontos do doador
-- 5. Cria notificação pode_doar com a data da próxima doação

create or replace function registrar_doacao(
  p_usuario_id uuid,
  p_hemocentro_id uuid,
  p_tipo_sanguineo text,
  p_peso numeric,
  p_funcionario_id uuid,
  p_observacao text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_doacao_id uuid;
  v_movimentacao_id uuid;
  v_data_doacao date := current_date;
  v_sexo text;
  v_dias_intervalo int;
  v_proxima_doacao date;
begin
  -- Valida doador
  select sexo into v_sexo
  from usuarios
  where id = p_usuario_id;

  if not found then
    return jsonb_build_object('ok', false, 'erro', 'Doador não encontrado');
  end if;

  -- Valida hemocentro
  if not exists (select 1 from hemocentros where id = p_hemocentro_id) then
    return jsonb_build_object('ok', false, 'erro', 'Hemocentro não encontrado');
  end if;

  -- Valida tipo sanguíneo
  if p_tipo_sanguineo not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    return jsonb_build_object('ok', false, 'erro', 'Tipo sanguíneo inválido');
  end if;

  -- 1. Insere doação
  insert into doacoes (
    usuario_id, hemocentro_id, tipo_sanguineo, data_doacao, status, peso, observacao
  ) values (
    p_usuario_id, p_hemocentro_id, p_tipo_sanguineo, v_data_doacao, 'realizada', p_peso, p_observacao
  )
  returning id into v_doacao_id;

  -- 2. Insere movimentação de estoque (trigger trg_aplicar_movimentacao
  --    atualiza estoque_sangue e trg_check_estoque pode resolver alertas)
  insert into movimentacoes_estoque (
    hemocentro_id, tipo_sanguineo, tipo_movimentacao, origem,
    quantidade, doacao_id, funcionario_id
  ) values (
    p_hemocentro_id, p_tipo_sanguineo, 'entrada', 'doacao',
    1, v_doacao_id, p_funcionario_id
  )
  returning id into v_movimentacao_id;

  -- 3. Atualiza contadores do doador
  update usuarios
  set total_doacoes = total_doacoes + 1,
      pontos = pontos + 10,
      tipo_sanguineo = coalesce(tipo_sanguineo, p_tipo_sanguineo),
      updated_at = now()
  where id = p_usuario_id;

  -- 4. Calcula próxima doação permitida (Ministério da Saúde: 60 dias mulher, 90 dias homem)
  v_dias_intervalo := case when v_sexo = 'F' then 60 else 90 end;
  v_proxima_doacao := v_data_doacao + (v_dias_intervalo || ' days')::interval;

  -- 5. Cria notificação
  insert into notificacoes (usuario_id, tipo, titulo, mensagem, canal)
  values (
    p_usuario_id,
    'pode_doar',
    'Você já pode doar novamente',
    format('Sua próxima doação pode ser feita a partir de %s.', to_char(v_proxima_doacao, 'DD/MM/YYYY')),
    'app'
  );

  return jsonb_build_object(
    'ok', true,
    'id', v_doacao_id,
    'data_doacao', v_data_doacao,
    'proxima_doacao_permitida', v_proxima_doacao,
    'movimentacao_id', v_movimentacao_id
  );
end;
$$;