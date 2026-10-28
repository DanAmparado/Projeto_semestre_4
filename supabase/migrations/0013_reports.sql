-- Previsão de demanda sazonal (função original, preservada)
create or replace function previsao_demanda_sazonal(
  p_hemocentro_id uuid,
  p_tipo_sanguineo text,
  p_semanas_historico int default 52,
  p_horizonte_semanas int default 4
)
returns table (
  semana_previsao date,
  demanda_prevista numeric,
  limite_inferior_95 numeric,
  limite_superior_95 numeric,
  componente_tendencia numeric,
  componente_sazonal numeric
)
language plpgsql
security invoker
as $$
begin
  return query
  with base as (
    select
      date_trunc('week', data_doacao)::date as semana,
      extract(week from data_doacao)::int as semana_iso,
      count(*)::numeric as y
    from doacoes
    where hemocentro_id = p_hemocentro_id
      and tipo_sanguineo = p_tipo_sanguineo
      and status = 'realizada'
      and data_doacao >= (current_date - (p_semanas_historico || ' weeks')::interval)
    group by 1, 2
  ),
  global_avg as (select avg(y)::numeric as media_global from base),
  por_semana_iso as (
    select semana_iso, avg(y)::numeric as media_semana
    from base group by semana_iso
  ),
  indice_sazonal as (
    select p.semana_iso,
           (p.media_semana / nullif(g.media_global, 0))::numeric as idx
    from por_semana_iso p cross join global_avg g
  ),
  tendencia as (
    select
      regr_slope(y, extract(epoch from semana)::numeric)::numeric as b,
      regr_intercept(y, extract(epoch from semana)::numeric)::numeric as a,
      stddev_samp(y)::numeric as sigma
    from base
  ),
  ultima as (select max(semana) as ult, max(y) as ult_y from base),
  previsoes as (select generate_series(1, p_horizonte_semanas) as h)
  select
    (u.ult + (p.h * 7) * interval '1 day')::date as semana_previsao,
    (u.ult_y * coalesce(i.idx, 1) * (1 + (t.b * p.h) / nullif(u.ult_y, 0)))::numeric as demanda_prevista,
    greatest(
      (u.ult_y * coalesce(i.idx, 1) * (1 + (t.b * p.h) / nullif(u.ult_y, 0)))
      - 1.96 * coalesce(t.sigma, 0),
      0
    )::numeric as limite_inferior_95,
    (u.ult_y * coalesce(i.idx, 1) * (1 + (t.b * p.h) / nullif(u.ult_y, 0)))
    + 1.96 * coalesce(t.sigma, 0) as limite_superior_95,
    (u.ult_y * (1 + (t.b * p.h) / nullif(u.ult_y, 0)))::numeric as componente_tendencia,
    (u.ult_y * coalesce(i.idx, 1))::numeric as componente_sazonal
  from previsoes p
  cross join tendencia t
  cross join ultima u
  left join indice_sazonal i
    on i.semana_iso = extract(week from (u.ult + (p.h * 7) * interval '1 day'))::int;
end;
$$;

-- Relatório de média de doações
create or replace function relatorio_media_doacoes(
  p_hemocentro_id uuid,
  p_data_inicial date,
  p_data_final date
)
returns jsonb
language plpgsql
as $$
declare
  v_resumo jsonb;
  v_distribuicao jsonb;
begin
  select jsonb_build_object(
    'total_doacoes', count(*),
    'media_diaria', round(count(*)::numeric / nullif((p_data_final - p_data_inicial + 1), 0), 2),
    'doadores_unicos', count(distinct usuario_id)
  ) into v_resumo
  from doacoes
  where hemocentro_id = p_hemocentro_id
    and status = 'realizada'
    and data_doacao >= p_data_inicial and data_doacao <= p_data_final;

  select jsonb_agg(jsonb_build_object('tipo', tipo_sanguineo, 'quantidade', total))
    into v_distribuicao
  from (
    select tipo_sanguineo, count(*) as total
    from doacoes
    where hemocentro_id = p_hemocentro_id
      and status = 'realizada'
      and data_doacao >= p_data_inicial and data_doacao <= p_data_final
    group by 1 order by total desc
  ) t;

  return jsonb_build_object(
    'resumo', coalesce(v_resumo, '{}'::jsonb),
    'distribuicao', coalesce(v_distribuicao, '[]'::jsonb)
  );
end;
$$;

-- Estudo de doadores
create or replace function relatorio_estudo_doador(
  p_hemocentro_id uuid,
  p_data_inicial date,
  p_data_final date
)
returns jsonb
language plpgsql
as $$
declare
  v_kpis jsonb;
  v_faixas jsonb;
begin
  with doadores_periodo as (
    select usuario_id, count(*) as qtd
    from doacoes
    where hemocentro_id = p_hemocentro_id
      and status = 'realizada'
      and data_doacao >= p_data_inicial and data_doacao <= p_data_final
    group by 1
  ),
  intervalos as (
    select data_doacao - lag(data_doacao) over (partition by usuario_id order by data_doacao) as gap
    from doacoes
    where hemocentro_id = p_hemocentro_id
      and status = 'realizada'
      and data_doacao >= p_data_inicial and data_doacao <= p_data_final
  )
  select jsonb_build_object(
    'total_doadores', (select count(*) from doadores_periodo),
    'doadores_retorno', (select count(*) from doadores_periodo where qtd >= 2),
    'taxa_retorno_pct', round(100.0 * (select count(*) from doadores_periodo where qtd >= 2)
                              / nullif((select count(*) from doadores_periodo), 0), 1),
    'tempo_medio_intervalo_dias', round(avg(extract(epoch from gap) / 86400.0), 1)
  ) into v_kpis
  from intervalos where gap is not null;

  with base as (
    select
      u.id,
      case
        when age(current_date, u.data_nascimento) < interval '25 years' then '18-24'
        when age(current_date, u.data_nascimento) < interval '35 years' then '25-34'
        when age(current_date, u.data_nascimento) < interval '45 years' then '35-44'
        when age(current_date, u.data_nascimento) < interval '55 years' then '45-54'
        else '55+'
      end as faixa,
      count(d.id) as total_doacoes
    from usuarios u
    join doacoes d on d.usuario_id = u.id
    where d.hemocentro_id = p_hemocentro_id
      and d.status = 'realizada'
      and d.data_doacao >= p_data_inicial and d.data_doacao <= p_data_final
    group by u.id, faixa
  )
  select jsonb_agg(jsonb_build_object(
    'faixa', faixa,
    'total', count(*),
    'retornaram', count(*) filter (where total_doacoes >= 2)
  )) into v_faixas
  from base group by faixa;

  return jsonb_build_object(
    'kpis', coalesce(v_kpis, '{}'::jsonb),
    'faixas_etarias', coalesce(v_faixas, '[]'::jsonb)
  );
end;
$$;

-- Controle estatístico de processo
create or replace function relatorio_cep(
  p_sensor_id uuid,
  p_data_inicial date,
  p_data_final date,
  p_lsl numeric default 2.0,
  p_usl numeric default 6.0
)
returns table (
  data_leitura timestamptz,
  temperatura numeric,
  umidade numeric,
  media_global numeric,
  limite_controle_superior numeric,
  limite_controle_inferior numeric,
  status_ponto text
)
language plpgsql
as $$
begin
  return query
  with base as (
    select created_at, temperatura, umidade
    from leituras_ambiente
    where sensor_id = p_sensor_id
      and created_at >= p_data_inicial::timestamptz
      and created_at <= (p_data_final + 1)::timestamptz
      and temperatura is not null
  ),
  stats as (
    select avg(temperatura)::numeric as mu, stddev_samp(temperatura)::numeric as sigma
    from base
  )
  select
    b.created_at,
    b.temperatura,
    b.umidade,
    round(s.mu, 2) as media_global,
    round(s.mu + 3 * s.sigma, 2) as limite_controle_superior,
    round(s.mu - 3 * s.sigma, 2) as limite_controle_inferior,
    case
      when b.temperatura < p_lsl or b.temperatura > p_usl then 'fora_especificacao'
      when b.temperatura > s.mu + 3 * s.sigma or b.temperatura < s.mu - 3 * s.sigma then 'fora_controle'
      else 'normal'
    end as status_ponto
  from base b cross join stats s
  order by b.created_at;
end;
$$;