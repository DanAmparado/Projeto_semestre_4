-- Habilita RLS em campanhas (faltou na 0014)
alter table campanhas enable row level security;

-- Funcionário ativo do hemocentro pode listar campanhas do próprio hemocentro
create policy "campanhas_funcionario_select" on campanhas
  for select
  using (
    exists (
      select 1 from hemocentro_usuarios
      where user_id = auth.uid()
        and hemocentro_id = campanhas.hemocentro_id
        and ativo = true
    )
  );

-- INSERT, UPDATE e DELETE: bloqueados via RLS (só service_role ou RPC
-- criar_campanha, que é security definer, consegue escrever)