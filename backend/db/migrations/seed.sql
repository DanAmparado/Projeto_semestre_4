-- Hemocentro de desenvolvimento
insert into hemocentros (id, nome, cidade, estado, telefone, email)
values ('11111111-1111-1111-1111-111111111111',
        'Hemocentro de Franca (Dev)', 'Franca', 'SP',
        '(16) 3711-0000', 'dev@hemocentro.local');

-- Estoque inicial dos 8 tipos
insert into estoque_sangue (hemocentro_id, tipo_sanguineo, quantidade_bolsas, nivel_minimo, nivel_critico) values
  ('11111111-1111-1111-1111-111111111111', 'A+', 20, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'A-', 8, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'B+', 15, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'B-', 4, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'AB+', 6, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'AB-', 2, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'O+', 30, 10, 5),
  ('11111111-1111-1111-1111-111111111111', 'O-', 3, 10, 5);

-- Sensores de teste (device_id fixo para o simulador)
insert into sensores (hemocentro_id, nome, tipo, device_id, localizacao, status) values
  ('11111111-1111-1111-1111-111111111111',
   'DHT22 Câmara Fria 1', 'ambiente', 'ESP32-DHT22-001', 'Câmara Fria 1', 'ativo');

insert into sensores (hemocentro_id, nome, tipo, device_id, localizacao, tipo_sanguineo_monitorado, status) values
  ('11111111-1111-1111-1111-111111111111',
   'Balança O+', 'balanca', 'ESP32-BALANCA-O+', 'Prateleira O+', 'O+', 'ativo');