create table alertas (
  id uuid primary key default gen_random_uuid(),
  hemocentro_id uuid not null references hemocentros(id) on delete cascade,
  tipo text not null check (tipo in (
    'estoque_baixo','estoque_critico',
    'temperatura_alta','temperatura_baixa',
    'umidade_alta','umidade_baixa',
    'sensor_offline'
  )),
  severidade text not null default 'aviso' check (severidade in ('info','aviso','critico')),
  mensagem text not null,
  referencia_id uuid,
  resolvido boolean not null default false,
  resolvido_em timestamptz,
  resolvido_por uuid references auth.users(id),
  created_at timestamptz default now()
);
create index idx_alertas_hemocentro on alertas(hemocentro_id);
create index idx_alertas_pendentes on alertas(hemocentro_id, resolvido) where resolvido = false;

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo text not null check (tipo in (
    'pode_doar','estoque_baixo','badge_conquistado','campanha','lembrete_agendamento'
  )),
  titulo text not null,
  mensagem text not null,
  canal text not null default 'app' check (canal in ('app','sms','email','push')),
  lida boolean not null default false,
  enviada boolean not null default false,
  referencia_id uuid,
  created_at timestamptz default now(),
  lida_em timestamptz
);
create index idx_notificacoes_usuario on notificacoes(usuario_id, lida);
create index idx_notificacoes_pendentes on notificacoes(enviada) where enviada = false;