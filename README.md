# Nosso Sangue

> Plataforma multiplataforma para integração de hemocentros, doadores e tecnologia IoT.

**Projeto Interdisciplinar — 4º semestre DSM**
**FATEC Franca "Dr. Thomaz Novelino" — 2026**

---

## Sobre o projeto

O Brasil tem 1,6% da população doadora de sangue, enquanto a OMS recomenda pelo menos 3% para repor adequadamente os estoques. O **Nosso Sangue** busca aumentar essa taxa com:

- **Informação** sobre aptidão, mitos e benefícios da doação
- **Engajamento** por campanhas direcionadas quando o estoque está em baixa
- **Dados em tempo real** do estoque e da câmara fria dos hemocentros
- **IoT** para monitoramento automático de temperatura, umidade e bolsas

## Arquitetura

- **Backend:** API REST em Node.js + TypeScript no **Render**
- **Banco:** PostgreSQL no **Supabase** com Auth e Row Level Security
- **Front web:** HTML + CSS + JavaScript (consumindo a API)
- **Mobile:** React Native + Expo
- **IoT:** ESP32 enviando leituras de ambiente e balança

Diagrama completo em [`docs/arquitetura.md`](docs/arquitetura.md).

## URLs em produção

| Recurso | URL |
|---|---|
| API | https://nosso-sangue-api.onrender.com/ |
| Documentação (Swagger) | https://nosso-sangue-api.onrender.com/docs |
| OpenAPI (YAML) | https://nosso-sangue-api.onrender.com/openapi.yaml |
| Front web | https://nosso-sangue.vercel.app/ |

## Estrutura do repositório

```
.
├── backend/            # API REST (Node.js + TypeScript + Express)
│   ├── src/            # código-fonte
│   ├── scripts/        # sync-migrations, seed-historico, smoke-test
│   └── db/             # migrations e seed
├── frontend/
│   ├── P-I-web/        # front web (HTML/CSS/JS)
│   └── p-i mobile ofc/ # app React Native (Expo)
├── iot/                # firmware ESP32
├── docs/
│   ├── adr/            # decisões de arquitetura
│   ├── api/            # openapi.yaml, auth-flow.md, iot-contract.md
│   ├── apresentacao.md # roteiro do vídeo de 5 min
│   ├── arquitetura.md  # diagramas
│   └── handoff-frontend.md # pendências do front
└── supabase/           # gerado por backend/scripts/sync-migrations.js
```

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- Docker Desktop
- Supabase CLI (`npm i -g supabase`)

### 1. Subir o banco

```bash
supabase start
```

Isso imprime `API URL`, `Publishable key`, `Secret key` e senha do Postgres.

### 2. Configurar o backend

```bash
cd backend
cp .env.example .env
# preencher SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run db:sync
cd ..
supabase db reset
cd backend
npm run seed:historico  # opcional: popula 15 doadores + histórico
npm run dev
```

API disponível em `http://localhost:3000/api/v1`. Swagger em `http://localhost:3000/docs`.

### 3. Servir o front web

```bash
cd "frontend/P-I-web"
python -m http.server 5500
```

Acessar via `http://127.0.0.1:5500` (não `localhost` — ver nota de IPv6 no README do front).

### 4. Rodar o mobile

```bash
cd "frontend/p-i mobile ofc"
npm install
npx expo start
```

## Credenciais de demonstração

| Tipo | Email | Senha |
|---|---|---|
| Funcionário (admin) | `funcionario@test.local` | `senha123` |
| Doadora Maria | `maria.doadora@test.local` | `senha123` |
| Doadores do seed | `seed01..15@test.local` | `senha123` |

Hemocentro padrão: `11111111-1111-1111-1111-111111111111` (Hemocentro de Franca).

## Documentação

- **Contrato da API:** [`docs/api/openapi.yaml`](docs/api/openapi.yaml) (v1.9.0)
- **Swagger interativo:** `/docs` no backend
- **Fluxo de autenticação:** [`docs/api/auth-flow.md`](docs/api/auth-flow.md)
- **Contrato IoT:** [`docs/api/iot-contract.md`](docs/api/iot-contract.md)
- **Decisões de arquitetura:** [`docs/adr/`](docs/adr/)
- **Roteiro do vídeo:** [`docs/apresentacao.md`](docs/apresentacao.md)

## Testes

Smoke test contra qualquer ambiente:

```bash
./backend/scripts/smoke-test.sh                                            # produção
./backend/scripts/smoke-test.sh http://localhost:3000/api/v1               # local
```

Valida 12 endpoints críticos (públicos, autenticados e Swagger) e retorna exit code 0 se tudo passar.

## Equipe

- Carolina Carneiro
- Daniel Lemos
- Guilherme Henrique
- Victor Medeiros

## Disciplinas integradas (4º semestre)

- **Laboratório de Desenvolvimento Web** (chave): API RESTful, OpenAPI, React
- **Internet das Coisas e Aplicações:** sensores, dashboard
- **Estatística:** gráficos, indicadores, CEP
- **Programação para Dispositivos Móveis I:** consumo da API, visualização

## Vídeo de demonstração

(a ser preenchido após gravação — link do YouTube público)
