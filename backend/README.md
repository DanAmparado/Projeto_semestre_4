# Nosso Sangue — Backend

API RESTful do PI "Nosso Sangue" (4º semestre DSM — FATEC Franca).
Integra hemocentros, doadores, sensores IoT e relatórios estatísticos.

## Stack
- Node.js 20+
- TypeScript + Express
- Zod (validação)
- Supabase (PostgreSQL + Auth + RLS)
- Swagger/OpenAPI para documentação

## Estrutura

```
backend/
├── src/
│   ├── config/env.ts
│   ├── lib/{supabase,logger}.ts
│   ├── errors/{AppError,httpErrors}.ts
│   ├── middlewares/{auth,autorizarFuncionario,validate,error,iotKey}.ts
│   ├── schemas/*.ts
│   ├── services/*.ts
│   ├── routes/*.ts
│   └── server.ts
├── scripts/
│   ├── sync-migrations.js
│   └── seed-historico.js
├── db/
│   ├── migrations/   (fonte — sincronizado via db:sync)
│   └── seed.sql
├── .env.example
├── package.json
└── README.md
```

As migrations são aplicadas pelo Supabase CLI em `supabase/migrations/`, mas a fonte fica em `backend/db/migrations/`.

## Pré-requisitos
- Node.js 20+
- Docker Desktop
- Supabase CLI (`npm i -g supabase`)

## Setup

```bash
# 1. Subir Supabase local
cd ..
supabase start

# 2. Copiar variáveis
cd backend
cp .env.example .env
# preencher com as chaves impressas pelo supabase start

# 3. Instalar
npm install

# 4. Sincronizar migrations e aplicar
npm run db:sync
cd ..
supabase db reset
cd backend

# 5. Rodar em dev
npm run dev
```

API: `http://localhost:3000/api/v1`
Swagger: `http://localhost:3000/docs` (quando habilitado)
Studio do Supabase: `http://127.0.0.1:54323`

## Seed para demo

Depois de `supabase db reset`, o banco tem o mínimo (hemocentro, sensores, estoque). Para popular dados históricos que enriquecem os relatórios:

```bash
npm run seed:historico
```

Cria:
- 15 doadores de teste (`seed01..15@test.local`, senha `senha123`)
- ~150 doações distribuídas em 52 semanas com sazonalidade
- 250 leituras de ambiente em 30 dias (96% na faixa 3-5°C, 4% outliers)

Pode rodar quantas vezes quiser — é idempotente.

## Usuários de teste

| Tipo | Email | Senha | Papel |
|---|---|---|---|
| Funcionário | `funcionario@test.local` | `senha123` | admin do Hemocentro Franca |
| Doadora | `maria.doadora@test.local` | `senha123` | O+, com 1 doação |
| Doadores extras | `seed01..15@test.local` | `senha123` | 8 tipos sanguíneos |

Para criar funcionário do zero via Admin API: `docs/dev/funcionario-teste.md`.

## Scripts

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "typecheck": "tsc --noEmit",
  "db:sync": "node scripts/sync-migrations.js",
  "db:reset": "npm run db:sync && cd .. && supabase db reset",
  "db:push": "cd .. && supabase db push",
  "seed:historico": "node scripts/seed-historico.js",
  "types": "supabase gen types typescript --local > src/types/database.ts"
}
```

## Endpoints

Contrato completo em `docs/api/openapi.yaml` (v1.8.0). Resumo por grupo:

| Grupo | Endpoints |
|---|---|
| Health | `GET /health` |
| Doador (`/me/*`) | `GET`, `PATCH /me`, `POST /me/elegibilidade`, `GET /me/doacoes`, `GET /me/notificacoes`, `PATCH /me/notificacoes/:id/lida` |
| Público | `GET /publico/hemocentros`, `GET /publico/hemocentros/:id/estoque`, `GET /publico/estoque` |
| Estoque | `GET /hemocentros/:id/estoque`, `GET`, `POST /hemocentros/:id/movimentacoes` |
| Doadores (funcionário) | `GET /hemocentros/:id/doadores?cpf=` |
| Doações | `POST /hemocentros/:id/doacoes` |
| Sensores | `GET`, `POST /hemocentros/:id/sensores`, `PATCH /sensores/:id`, `GET /hemocentros/:id/sensores/:sensorId/leituras` |
| IoT | `POST /iot/ambiente`, `POST /iot/balanca` |
| Alertas | `GET /hemocentros/:id/alertas`, `PATCH /alertas/:id/resolver` |
| Campanhas | `POST /hemocentros/:id/campanhas` |
| Notificações | `GET /hemocentros/:id/notificacoes` |
| Relatórios | `GET /hemocentros/:id/relatorios/{media-doacoes,estudo-doadores,previsao,cep}` |
| Dashboard | `GET /hemocentros/:id/dashboard/resumo` |

## Convenções
- Rotas: `/api/v1/...`
- Resposta de erro: `{ erro: { codigo, mensagem, detalhes } }`
- Validação com Zod em toda rota
- Autenticação: JWT do Supabase no header `Authorization: Bearer <token>`
- IoT: header `x-iot-key`
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente

## Documentação complementar
- `docs/api/openapi.yaml` — contrato completo
- `docs/api/auth-flow.md` — fluxo de autenticação
- `docs/api/iot-contract.md` — contrato IoT
- `docs/api/migracao-front.md` — guia de integração do front/mobile
- `docs/dev/funcionario-teste.md` — criar usuários de teste via Admin API
- `docs/adr/` — decisões de arquitetura