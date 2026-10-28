create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  cpf text unique not null,
  data_nascimento date not null,
  sexo text,
  tipo_sanguineo text check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  telefone text,
  email text,
  peso numeric(5,2),
  aceita_notificacoes_sms boolean default true,
  total_doacoes int default 0,
  pontos int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);