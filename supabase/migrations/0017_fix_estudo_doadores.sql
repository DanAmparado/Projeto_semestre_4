-- Corrige relatorio_estudo_doador: jsonb_agg(jsonb_build_object(... count(*) ...))
-- não funciona porque count(*) é agregação dentro de outra agregação (jsonb_agg).
-- Solução: agregar por faixa num CTE, depois jsonb_agg sobre o resultado.

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
  ),
  agregado_por_faixa as (
    select
      faixa,
      count(*) as total,
      count(*) filter (where total_doacoes >= 2) as retornaram
    from base
    group by faixa
  )
  select jsonb_agg(jsonb_build_object(
    'faixa', faixa,
    'total', total,
    'retornaram', retornaram
  )) into v_faixas
  from agregado_por_faixa;

  return jsonb_build_object(
    'kpis', coalesce(v_kpis, '{}'::jsonb),
    'faixas_etarias', coalesce(v_faixas, '[]'::jsonb)
  );
end;
$$;