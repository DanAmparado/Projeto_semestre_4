create table hemocentro_usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  hemocentro_id uuid references hemocentros(id) on delete cascade not null,
  nome text not null,
  cpf text not null,
  email text not null,
  role text default 'visualizador' check (role in ('admin','operador','visualizador')),
  ativo boolean default true,
  created_at timestamptz default now(),
  unique(user_id, hemocentro_id)
);