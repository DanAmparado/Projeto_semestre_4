# Criar funcionário de teste via Admin API

O Supabase Auth (GoTrue) não lida bem com inserts manuais em `auth.users` via SQL.
Usuários criados assim resultam em erro `Database error querying schema` no login.

Sempre crie funcionários de teste via Admin API.

## Variáveis de ambiente

As chaves locais saem do `supabase start`. **Nunca commite os valores reais.**
Sempre exporte no terminal antes de rodar os comandos:

```bash
export SUPABASE_SECRET_KEY=<valor de "Secret" no supabase start>
export SUPABASE_PUBLISHABLE_KEY=<valor de "Publishable" no supabase start>
```

Se o `supabase start` não estiver mais visível, rode `supabase status` para
ver as chaves novamente.

## 1. Criar usuário no Auth

```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -d '{
    "email": "funcionario@test.local",
    "password": "senha123",
    "email_confirm": true,
    "user_metadata": {
      "nome_completo": "Funcionário Teste",
      "cpf": "00000000",
      "data_nascimento": "1990-01-01"
    }
  }'
```

A resposta inclui o `id` do usuário criado. Anote.

## 2. Vincular ao hemocentro

Substitua `<ID_DO_USUARIO>` pelo UUID retornado no passo 1:

```bash
curl -X POST "http://127.0.0.1:54321/rest/v1/hemocentro_usuarios" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SECRET_KEY" \
  -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "<ID_DO_USUARIO>",
    "hemocentro_id": "11111111-1111-1111-1111-111111111111",
    "nome": "Funcionário Teste",
    "cpf": "00000000",
    "email": "funcionario@test.local",
    "role": "admin"
  }'
```

## 3. Fazer login

```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -d '{"email":"funcionario@test.local","password":"senha123"}'
```

Retorna `access_token`. Use no header `Authorization: Bearer <access_token>`
nas chamadas ao backend.

## Nota sobre segurança

As chaves de desenvolvimento do Supabase são públicas por design (rodam
apenas em `127.0.0.1`), mas o GitHub bloqueia o push de qualquer coisa
parecida com chave (`sb_secret_*`, `sb_publishable_*`, `sk_*`, etc.).
Sempre use placeholders em arquivos versionados. Os valores reais ficam
apenas no `.env` local, que está no `.gitignore`.