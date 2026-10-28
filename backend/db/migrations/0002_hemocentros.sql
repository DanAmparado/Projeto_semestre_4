create table hemocentros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text unique,
  endereco text,
  cidade text,
  estado text,
  cep text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  telefone text,
  email text,
  horario_funcionamento text,
  ativo boolean default true,
  created_at timestamptz default now()
);