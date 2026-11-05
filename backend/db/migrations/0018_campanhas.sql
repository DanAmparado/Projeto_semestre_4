-- Tabela campanhas: agrupa notificações enviadas em massa pelo hemocentro
create table campanhas (
  id uuid primary key default gen_random_uuid(),
  hemocentro_id uuid not null references hemocentros(id) on delete cascade,
  tipo_sanguineo text not null check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  titulo text not null,
  mensagem text not null,
  canal text not null default 'app' check (canal in ('app','sms','email','push')),
  total_notificados int not null default 0,
  created_at timestamptz default now()
);

create index idx_campanhas_hemocentro on campanhas(hemocentro_id, created_at desc);

-- Cria campanha e envia (mock) notificações para doadores do tipo alvo.
-- Retorna resumo. É idempotente em termos de validação: falha clara se
-- hemocentro/tipo/canal forem inválidos.
create or replace function criar_campanha(
  p_hemocentro_id uuid,
  p_tipo_sanguineo text,
  p_titulo text,
  p_mensagem text,
  p_canal text default 'app'
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_campanha_id uuid;
  v_total int := 0;
  v_doador record;
begin
  if not exists (select 1 from hemocentros where id = p_hemocentro_id and ativo = true) then
    return jsonb_build_object('ok', false, 'erro', 'Hemocentro não encontrado');
  end if;

  if p_tipo_sanguineo not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    return jsonb_build_object('ok', false, 'erro', 'Tipo sanguíneo inválido');
  end if;

  if p_canal not in ('app','sms','email','push') then
    return jsonb_build_object('ok', false, 'erro', 'Canal inválido');
  end if;

  insert into campanhas (hemocentro_id, tipo_sanguineo, titulo, mensagem, canal)
  values (p_hemocentro_id, p_tipo_sanguineo, p_titulo, p_mensagem, p_canal)
  returning id into v_campanha_id;

  for v_doador in
    select id from usuarios
    where tipo_sanguineo = p_tipo_sanguineo
      and (p_canal <> 'sms' or aceita_notificacoes_sms = true)
  loop
    insert into notificacoes (
      usuario_id, tipo, titulo, mensagem, canal, referencia_id, enviada
    ) values (
      v_doador.id, 'campanha', p_titulo, p_mensagem, p_canal, v_campanha_id, true
    );
    v_total := v_total + 1;
  end loop;

  update campanhas set total_notificados = v_total where id = v_campanha_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_campanha_id,
    'tipo_sanguineo', p_tipo_sanguineo,
    'titulo', p_titulo,
    'canal', p_canal,
    'total_notificados', v_total
  );
end;
$$;