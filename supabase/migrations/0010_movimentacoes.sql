create table movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  hemocentro_id uuid not null references hemocentros(id) on delete cascade,
  tipo_sanguineo text not null check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  tipo_movimentacao text not null check (tipo_movimentacao in ('entrada','saida')),
  origem text not null check (origem in (
    'doacao','transfusao','descarte','ajuste_manual','iot_balanca'
  )),
  quantidade integer not null check (quantidade > 0),
  sensor_id uuid references sensores(id) on delete set null,
  doacao_id uuid references doacoes(id) on delete set null,
  funcionario_id uuid references auth.users(id) on delete set null,
  observacao text,
  metadados jsonb,
  created_at timestamptz default now()
);

create index idx_mov_hemocentro on movimentacoes_estoque(hemocentro_id);
create index idx_mov_tipo on movimentacoes_estoque(tipo_sanguineo, created_at desc);
create index idx_mov_data on movimentacoes_estoque(created_at desc);
create index idx_mov_sensor on movimentacoes_estoque(sensor_id) where sensor_id is not null;
create index idx_mov_doacao on movimentacoes_estoque(doacao_id) where doacao_id is not null;