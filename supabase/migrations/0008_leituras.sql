create table leituras_balanca (
  id bigserial primary key,
  sensor_id uuid not null,
  tipo_sanguineo text not null,
  peso_kg numeric(6,3) not null,
  bolsas_estimadas int,
  created_at timestamptz default now()
);
create index idx_leituras_balanca_sensor on leituras_balanca(sensor_id, created_at desc);

create table leituras_ambiente (
  id bigserial primary key,
  sensor_id uuid not null,
  temperatura numeric(5,2),
  umidade numeric(5,2),
  alerta boolean default false,
  created_at timestamptz default now()
);
create index idx_leituras_ambiente_sensor on leituras_ambiente(sensor_id, created_at desc);