create trigger trg_sensores_updated_at
  before update on sensores
  for each row execute function update_updated_at();

create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function update_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create trigger trg_aplicar_movimentacao
  after insert on movimentacoes_estoque
  for each row execute function aplicar_movimentacao_estoque();

create trigger trg_verificar_ambiente
  after insert on leituras_ambiente
  for each row execute function verificar_ambiente_e_alertar();

create trigger trg_check_estoque
  after insert or update of quantidade_bolsas on estoque_sangue
  for each row execute function check_estoque_alerta();