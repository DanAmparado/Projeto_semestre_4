# Nosso Sangue — Backend

API RESTful do PI "Nosso Sangue" (4º semestre DSM — FATEC Franca).
Integra hemocentros, doadores, sensores IoT e relatórios estatísticos.

## Stack
- Node.js 20+
- TypeScript
- Express
- Zod (validação)
- Supabase (PostgreSQL + Auth)
- Swagger / OpenAPI para documentação

## Estrutura

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── autorizarFuncionario.ts
│   │   └── error.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── me.routes.ts
│   │   ├── publico.routes.ts
│   │   ├── estoque.routes.ts
│   │   ├── sensores.routes.ts
│   │   ├── iot.routes.ts
│   │   ├── alertas.routes.ts
│   │   ├── campanhas.routes.ts
│   │   ├── notificacoes.routes.ts
│   │   ├── relatorios.routes.ts
│   │   └── dashboard.routes.ts
│   ├── schemas/
│   ├── services/
│   └── server.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

As migrations SQL ficam em `supabase/migrations/` na raiz do repositório ou em `backend/db/`, conforme combinado com o time de BD.

## Pré-requisitos
- Node.js 20+
- Docker Desktop
- Supabase CLI (`npm i -g supabase`)

## Setup local

```bash
# 1. Subir o banco e o auth locais
supabase start

# 2. Copiar variáveis
cp .env.example .env
# preencher com os valores impressos pelo supabase start

# 3. Instalar dependências
npm install

# 4. Rodar em dev
npm run dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Studio do Supabase: `http://localhost:54323`

## Variáveis de ambiente

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon local>
SUPABASE_SERVICE_ROLE_KEY=<service_role local>

IOT_KEY=dev-iot-key-123
CORS_ORIGIN=http://localhost:5173,http://localhost:8081
```

## Scripts sugeridos

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

## Convenções
- Rotas: `/api/v1/...`
- Resposta de erro: `{ erro: { codigo, mensagem, detalhes } }`
- Validação com Zod em toda rota.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente.
- Commit referenciando a issue ou entrega.

## Documentação complementar
- `docs/api/openapi.yaml` — contrato da API
- `docs/api/iot-contract.md` — contrato IoT
- `docs/api/auth-flow.md` — fluxo de autenticação
- `docs/adr/` — decisões de arquitetura