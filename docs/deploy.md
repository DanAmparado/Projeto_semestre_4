# Deploy e Infraestrutura — Nosso Sangue

Documento reproduzível de como o projeto está deployado em produção e como reproduzir o ambiente do zero.

## URLs em produção

| Recurso | URL |
|---|---|
| **API (Render)** | https://nosso-sangue-api.onrender.com/ |
| **Swagger** | https://nosso-sangue-api.onrender.com/docs |
| **OpenAPI YAML** | https://nosso-sangue-api.onrender.com/openapi.yaml |
| **Front Web (Vercel)** | https://nosso-sangue.vercel.app |
| **Supabase (remoto)** | https://qspukyphnexyrhltabel.supabase.co |
| **Supabase Studio** | https://supabase.com/dashboard/project/qspukyphnexyrhltabel |

## Arquitetura de produção

```
┌─────────────────┐     ┌─────────────────┐
│  Vercel         │     │  Expo Go        │
│  (front web)    │     │  (mobile dev)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │ HTTPS + JWT
                     ▼
         ┌───────────────────────┐
         │  Render (free tier)   │
         │  API REST Node.js 22  │
         └───────────┬───────────┘
                     │ Service Role
                     ▼
         ┌───────────────────────┐
         │  Supabase (São Paulo) │
         │  PostgreSQL + Auth    │
         └───────────────────────┘

         ┌───────────┐
         │  ESP32    │ ── x-iot-key ──> Render
         └───────────┘
```

## Stack de produção

| Componente | Plataforma | Plano | Região |
|---|---|---|---|
| Backend | Render | Free | Oregon |
| Banco + Auth | Supabase | Free | South America (São Paulo) |
| Front web | Vercel | Free (Hobby) | Global (edge) |

## Variáveis de ambiente

### Render (backend)

Configuradas no painel do Render → `nosso-sangue-api` → Environment:

| Variável | Origem | Como obter |
|---|---|---|
| `NODE_VERSION` | `22` | Fixa no `render.yaml` |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | `https://qspukyphnexyrhltabel.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase → API Keys → Publishable | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → Secret | `sb_secret_...` |
| `IOT_KEY` | Gerada automaticamente pelo Render | `generateValue: true` no `render.yaml` |
| `CORS_ORIGIN` | Configuração manual | Ver seção "CORS" abaixo |

**Atenção:** `SUPABASE_SERVICE_ROLE_KEY` **nunca** vai para o front. Só no backend.

### Vercel (front web)

Nenhuma variável de ambiente necessária. As chaves do Supabase estão hardcoded em `frontend/P-I-web/js/supabase.js` (apenas a Publishable, que é pública por design).

### Mobile

`.env` local (não commitado, protegido pelo `.gitignore`):

```env
EXPO_PUBLIC_API_URL=https://nosso-sangue-api.onrender.com/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://qspukyphnexyrhltabel.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

O `.env.example` está no repo para quem clonar saber o que preencher.

## Reproduzir o deploy do zero

### 1. Supabase remoto

```bash
# 1.1. Criar projeto em supabase.com/dashboard
# Região: South America (São Paulo)
# Guardar: Project URL, Publishable key, Secret key, senha do Postgres

# 1.2. Linkar o repo ao projeto remoto
supabase login
supabase link --project-ref <project-ref>

# 1.3. Aplicar as 19 migrations
supabase db push

# 1.4. Aplicar o seed mínimo (via SQL Editor do Studio ou psql)
# Colar o conteúdo de supabase/seed.sql no Studio e executar

# 1.5. Popular dados históricos (via script Node, apontando para o remoto)
cd backend
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<sb_secret_...> \
node scripts/seed-historico.js
```

**Atenção:** o `supabase db push` **não** roda o `seed.sql` automaticamente. Aplicar manualmente.

### 2. Backend no Render

```bash
# 2.1. O render.yaml na raiz já configura tudo
# 2.2. No Render dashboard: New + → Blueprint → conectar repo
# 2.3. Preencher as env vars (sync: false) no painel:
#      SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# 2.4. Aguardar primeiro build (~5-10 min)
# 2.5. Testar: curl https://<nome>.onrender.com/api/v1/health
```

### 3. Front web no Vercel

```bash
# 3.1. vercel.com/new → Import Git Repository → selecionar repo
# 3.2. Configuração:
#      Framework Preset: Other
#      Root Directory: frontend/P-I-web
#      Build Command: (vazio)
#      Output Directory: (vazio)
#      Install Command: (vazio)
# 3.3. Deploy
# 3.4. Copiar a URL gerada (ex.: nosso-sangue.vercel.app)
```

### 4. CORS no Render (crítico)

Depois do Vercel gerar a URL, editar no painel do Render:

```env
CORS_ORIGIN=https://nosso-sangue.vercel.app,http://localhost:5173,http://localhost:5500,http://localhost:8080,http://localhost:8081,http://127.0.0.1:5500,http://127.0.0.1:5173
```

**Regras:**
- Uma linha só
- Sem espaço entre as vírgulas
- **Sem barra no final de cada URL** (erro comum — `cors` do Express faz match exato)
- Incluir os `localhost` para desenvolvimento local

Render redeploya automaticamente.

### 5. Usuários de teste (Admin API)

O `seed-historico.js` cria 15 doadores (`seed01..15@test.local`), mas **não** cria o funcionário. Criar manualmente via Admin API:

```bash
# 5.1. Criar funcionário
curl -X POST "https://<ref>.supabase.co/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: <sb_secret_...>" \
  -H "Authorization: Bearer <sb_secret_...>" \
  -d '{"email":"funcionario@test.local","password":"senha123","email_confirm":true,"user_metadata":{"nome_completo":"Funcionario Teste","cpf":"00000000","data_nascimento":"1990-01-01"}}'

# 5.2. Anotar o UUID retornado

# 5.3. Vincular ao hemocentro
curl -X POST "https://<ref>.supabase.co/rest/v1/hemocentro_usuarios" \
  -H "Content-Type: application/json" \
  -H "apikey: <sb_secret_...>" \
  -H "Authorization: Bearer <sb_secret_...>" \
  -H "Prefer: return=representation" \
  -d '{"user_id":"<uuid>","hemocentro_id":"11111111-1111-1111-1111-111111111111","nome":"Funcionario Teste","cpf":"00000000","email":"funcionario@test.local","role":"admin"}'
```

## CORS — como funciona e onde configurar

O `cors` do Express faz **comparação exata de string** entre o header `Origin` do browser e os valores em `CORS_ORIGIN`. Qualquer caractere diferente (espaço, barra, http vs https) faz a origem não bater.

**Erros comuns e sintoma:**

| Erro no `CORS_ORIGIN` | Sintoma no browser |
|---|---|
| `https://app.vercel.app/` (barra) | `CORS header 'Access-Control-Allow-Origin' missing` |
| `https://app.vercel.app ` (espaço) | Idem |
| `http://app.vercel.app` (http) | Idem |
| Valor vazio | Bloqueia todas as origens |

**Diagnóstico via curl:**

```bash
curl -i -X OPTIONS "https://nosso-sangue-api.onrender.com/api/v1/hemocentros/11111111-1111-1111-1111-111111111111/estoque" \
  -H "Origin: https://nosso-sangue.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  | grep -i "access-control"
```

Se `access-control-allow-origin: https://nosso-sangue.vercel.app` aparecer, CORS OK. Se não, o valor em `CORS_ORIGIN` está errado.

## Troubleshooting

### Render falha no build com `tsc: not found`

O `NODE_ENV=production` faz o npm pular `devDependencies`. O `render.yaml` já tem `buildCommand: npm install --include=dev && npm run build` para resolver.

### Render falha no build com `TS5108: Option 'moduleResolution=node10' has been removed`

TypeScript moderno removeu `node10`. O `tsconfig.json` usa `moduleResolution: "Node16"`.

### Runtime: `Node.js detected but native WebSocket not found`

O `@supabase/supabase-js` recente exige WebSocket nativo, que só existe no Node.js 22+. O `render.yaml` fixa `NODE_VERSION: "22"`.

### Runtime: `Invalid API key` (500 nos endpoints)

Chave do Supabase errada ou rotacionada. Editar `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no painel do Render com os valores atuais do Supabase Dashboard.

### Login retorna `Invalid login credentials`

O usuário não existe no projeto remoto. Criar via Admin API (seção 5 acima). O `seed-historico.js` cria os doadores (`seed01..15`), mas não o funcionário.

### Front web: `CORS request did not succeed` (status null)

Ver seção "CORS" acima. Checar barra no final, espaço, http vs https.

### Front web local no Windows: `http://[::1]:5500`

O browser resolve `localhost` para IPv6 no Windows, e o CORS configurado é IPv4. **Acessar via `http://127.0.0.1:5500`** em vez de `http://localhost:5500`.

### Cold start do Render (~30s na primeira request)

O free tier hiberna após 15 min inativo. Opções:
1. Aceitar (aquecer antes de testar/demo com `curl .../health`)
2. UptimeRobot pingando `/health` a cada 10 min
3. Plano Starter ($7/mês) não hiberna

### Supabase pausa após 7 dias inativo

Free tier pausa projetos sem uso. O PI é usado durante o semestre, não deve acontecer. Se acontecer, "Restore" no dashboard.

### Trigger de alertas não disparou no remoto

Cenário reproduzido em produção: o `seed-historico.js` insere leituras antes do `seed.sql` criar o sensor, então o trigger retorna cedo (`if v_hemocentro_id is null then return new; end if`). **Solução:** rodar `seed.sql` primeiro, depois `seed-historico.js`. Se já tiver dados órfãos:

```sql
update leituras_ambiente la
set sensor_id = s.id
from sensores s
where s.device_id = 'ESP32-DHT22-001'
  and la.sensor_id not in (select id from sensores);
```

## Smoke test

O `backend/scripts/smoke-test.sh` valida os 12 endpoints críticos em qualquer ambiente:

```bash
./backend/scripts/smoke-test.sh                                            # produção
./backend/scripts/smoke-test.sh http://localhost:3000/api/v1               # local
```

Roda antes da demo ou depois de cada deploy para confirmar que nada quebrou.

## Segurança

- **Publishable key** (`sb_publishable_...`) é pública por design — pode estar no front, é protegida por RLS.
- **Secret key** (`sb_secret_...`) **só no backend**. Nunca no repo, nunca no front, nunca no chat.
- **Se vazar uma Secret key:** Supabase Dashboard → Settings → API Keys → Roll. Atualizar no Render.
- **`IOT_KEY`** é gerada pelo Render (`generateValue: true`). Trocar rotacionando no painel.

## Rotação de credenciais (procedimento)

Se uma chave for exposta:

1. **Supabase Dashboard** → Settings → API Keys → **Roll** na chave comprometida
2. Copiar o novo valor
3. **Render** → Environment → colar o novo valor
4. **Render** redeploya automaticamente (~1 min)
5. Confirmar com `./backend/scripts/smoke-test.sh`

Se for a Publishable key:
1. Roll no Supabase
2. Atualizar `frontend/P-I-web/js/supabase.js` e `frontend/p-i mobile ofc/.env`
3. Commit, push, redeploy Vercel

## Status atual

| Componente | Status | Última validação |
|---|---|---|
| Backend (Render) | ✅ Live | 2026-11-06 |
| Banco (Supabase) | ✅ Ativo | 2026-11-06 |
| Front web (Vercel) | ✅ Live | 2026-11-06 |
| Smoke test | ✅ 12/12 | 2026-11-06 |
