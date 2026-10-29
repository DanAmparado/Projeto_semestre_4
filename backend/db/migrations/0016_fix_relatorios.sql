-- Corrige duas funções de relatório:
-- 1. relatorio_estudo_doador: date - date retorna integer, então extract(epoch from gap)
--    falha. Como gap já está em dias, basta avg(gap).
-- 2. relatorio_cep: nome de coluna OUT colide com coluna de CTE. Adiciona
--    #variable_conflict use_column para preferir colunas.

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
    'tempo_medio_intervalo_dias', round(avg(gap), 1)
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
#variable_conflict use_column
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
    round(s.mu, 2),
    round(s.mu + 3 * s.sigma, 2),
    round(s.mu - 3 * s.sigma, 2),
    case
      when b.temperatura < p_lsl or b.temperatura > p_usl then 'fora_especificacao'
      when b.temperatura > s.mu + 3 * s.sigma or b.temperatura < s.mu - 3 * s.sigma then 'fora_controle'
      else 'normal'
    end
  from base b cross join stats s
  order by b.created_at;
end;
$$;