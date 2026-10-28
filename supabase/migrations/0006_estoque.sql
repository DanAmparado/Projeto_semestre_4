create table estoque_sangue (
  id uuid primary key default gen_random_uuid(),
  hemocentro_id uuid references hemocentros(id) on delete cascade not null,
  tipo_sanguineo text not null check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  quantidade_bolsas int default 0,
  nivel_minimo int default 10,
  nivel_critico int default 5,
  updated_at timestamptz default now(),
  unique (hemocentro_id, tipo_sanguineo)
);