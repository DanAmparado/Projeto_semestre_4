create table sensores (
  id uuid primary key default gen_random_uuid(),
  hemocentro_id uuid not null references hemocentros(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('balanca','ambiente','camera','combinado')),
  device_id text unique not null,
  localizacao text,
  modelo text,
  versao_firmware text,
  tipo_sanguineo_monitorado text check (tipo_sanguineo_monitorado in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  status text not null default 'ativo' check (status in ('ativo','inativo','manutencao')),
  ultima_comunicacao timestamptz,
  instalado_em timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sensores_hemocentro on sensores(hemocentro_id);
create index idx_sensores_status on sensores(hemocentro_id, status);