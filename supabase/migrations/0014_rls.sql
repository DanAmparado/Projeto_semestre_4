alter table hemocentros enable row level security;
alter table usuarios enable row level security;
alter table hemocentro_usuarios enable row level security;
alter table doacoes enable row level security;
alter table estoque_sangue enable row level security;
alter table sensores enable row level security;
alter table leituras_balanca enable row level security;
alter table leituras_ambiente enable row level security;
alter table alertas enable row level security;
alter table notificacoes enable row level security;
alter table movimentacoes_estoque enable row level security;

-- Leitura pública
create policy "hemocentros_leitura_publica" on hemocentros for select using (true);
create policy "estoque_leitura_publica" on estoque_sangue for select using (true);

-- Próprio usuário
create policy "usuarios_proprio_select" on usuarios for select using (auth.uid() = id);
create policy "usuarios_proprio_update" on usuarios for update using (auth.uid() = id);
create policy "hemocentro_usuarios_proprio" on hemocentro_usuarios for select using (auth.uid() = user_id);
create policy "doacoes_proprio" on doacoes for select using (auth.uid() = usuario_id);
create policy "notificacoes_proprio_select" on notificacoes for select using (auth.uid() = usuario_id);
create policy "notificacoes_proprio_update" on notificacoes for update using (auth.uid() = usuario_id);

-- Funcionários do hemocentro
create policy "sensores_funcionario" on sensores for select using (
  exists (select 1 from hemocentro_usuarios
          where user_id = auth.uid() and hemocentro_id = sensores.hemocentro_id and ativo = true)
);
create policy "leituras_balanca_funcionario" on leituras_balanca for select using (
  exists (select 1 from sensores s
          join hemocentro_usuarios hu on hu.hemocentro_id = s.hemocentro_id
          where s.id = leituras_balanca.sensor_id and hu.user_id = auth.uid() and hu.ativo = true)
);
create policy "leituras_ambiente_funcionario" on leituras_ambiente for select using (
  exists (select 1 from sensores s
          join hemocentro_usuarios hu on hu.hemocentro_id = s.hemocentro_id
          where s.id = leituras_ambiente.sensor_id and hu.user_id = auth.uid() and hu.ativo = true)
);
create policy "alertas_funcionario" on alertas for select using (
  exists (select 1 from hemocentro_usuarios
          where user_id = auth.uid() and hemocentro_id = alertas.hemocentro_id and ativo = true)
);
create policy "movimentacoes_funcionario" on movimentacoes_estoque for select using (
  exists (select 1 from hemocentro_usuarios
          where user_id = auth.uid() and hemocentro_id = movimentacoes_estoque.hemocentro_id and ativo = true)
);