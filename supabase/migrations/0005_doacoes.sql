-- Tabela faltante no documento original; necessária para relatórios e histórico
create table doacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  hemocentro_id uuid not null references hemocentros(id) on delete cascade,
  tipo_sanguineo text not null check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  data_doacao date not null default current_date,
  status text not null default 'realizada' check (status in ('agendada','realizada','cancelada','inapta')),
  peso numeric(5,2),
  observacao text,
  created_at timestamptz default now()
);

create index idx_doacoes_hemocentro_data on doacoes(hemocentro_id, data_doacao desc);
create index idx_doacoes_usuario on doacoes(usuario_id, data_doacao desc);