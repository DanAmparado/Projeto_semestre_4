# Arquitetura — Nosso Sangue

## Visão geral

```mermaid
graph TB
    subgraph Clientes
        W[Front Web<br/>HTML/CSS/JS]
        M[Mobile<br/>React Native + Expo]
    end

    subgraph Backend
        API[API REST<br/>Node.js + TypeScript<br/>Render]
    end

    subgraph Dados
        SB[(PostgreSQL<br/>Supabase<br/>+ Auth + RLS)]
    end

    subgraph IoT
        ESP32[ESP32 + DHT22<br/>Sensor de ambiente]
        BAL[ESP32 + Balança<br/>Sensor de peso]
    end

    W -->|HTTPS + JWT| API
    M -->|HTTPS + JWT| API
    ESP32 -->|HTTPS + x-iot-key| API
    BAL -->|HTTPS + x-iot-key| API

    API -->|Service Role| SB
    W -.->|Auth direto<br/>Supabase-js| SB
    M -.->|Auth direto<br/>Supabase-js| SB
```

## Componentes

### Backend (API REST)

- **Stack:** Node.js 22, TypeScript, Express, Zod, Supabase-js
- **Deploy:** Render (free tier)
- **URL:** https://nosso-sangue-api.onrender.com/api/v1
- **Docs interativas:** https://nosso-sangue-api.onrender.com/docs
- **Autenticação:** valida JWT do Supabase em toda rota protegida
- **Ingestão IoT:** header `x-iot-key` para dispositivos

### Banco de dados (Supabase)

- **PostgreSQL 15** com extensões `pgcrypto` e `pg_cron`
- **Auth (GoTrue):** gerencia login, cadastro, JWT, reset de senha
- **Row Level Security (RLS):** policies por perfil (doador, funcionário, público)
- **19 migrations** versionadas em `supabase/migrations/`
- **RPCs (funções SQL):**
  - `processar_leitura_balanca` — detecta movimentação por delta de peso
  - `registrar_doacao` — operação atômica de registro de doação
  - `previsao_demanda_sazonal` — SARIMA simplificado com índice sazonal
  - `relatorio_media_doacoes`, `relatorio_estudo_doador`, `relatorio_cep`

### Front Web

- **Stack:** HTML + CSS + JavaScript puro (módulos ES), sem build
- **Auth:** `supabase-js` via CDN
- **Deploy:** Vercel (planejado)
- **Páginas:** login, dashboard, estoque, câmara fria, alertas, doador, campanha, relatórios

### Mobile

- **Stack:** React Native + Expo + Expo Router
- **Auth:** `supabase-js` com AsyncStorage
- **Deploy:** Expo Go (dev) ou EAS Build (produção)
- **Telas:** login, home (hemocentros por cidade), perfil, histórico, notificações

### IoT

- **Hardware:** ESP32 + sensor DHT22 (temperatura e umidade) + balança de precisão
- **Protocolo:** HTTP POST a cada 30 segundos
- **Autenticação:** header `x-iot-key` (gerado no Render)
- **Endpoints:** `POST /iot/ambiente` e `POST /iot/balanca`

## Fluxos principais

### 1. Doação de sangue

```mermaid
sequenceDiagram
    participant Doador
    participant App as App Mobile
    participant Func as Funcionário
    participant Web as Front Web
    participant API
    participant DB as Supabase

    Doador->>App: Cadastro (supabase.auth.signUp)
    App->>DB: auth.users criado
    DB-->>API: trigger handle_new_user
    API->>DB: INSERT em public.usuarios

    Doador->>App: Doação na recepção
    Func->>Web: Busca CPF
    Web->>API: GET /hemocentros/:id/doadores?cpf=...
    API->>DB: SELECT usuarios
    DB-->>API: dados do doador
    Func->>Web: Registra doação
    Web->>API: POST /hemocentros/:id/doacoes
    API->>DB: RPC registrar_doacao (atômica)
    Note over DB: INSERT doacao<br/>INSERT movimentacao<br/>UPDATE estoque<br/>UPDATE total_doacoes<br/>INSERT notificacao pode_doar
    API-->>Web: 201 + proxima_doacao_permitida
    Doador->>App: Vê notificação (GET /me/notificacoes)
```

### 2. Ingestão IoT

```mermaid
sequenceDiagram
    participant ESP as ESP32
    participant API
    participant DB as Supabase
    participant Web as Dashboard

    loop A cada 30s
        ESP->>API: POST /iot/ambiente (temp, umid)
        API->>DB: INSERT leituras_ambiente
        Note over DB: trigger verifica faixa<br/>2-6°C / 50-80%<br/>Se fora: INSERT alerta
        API-->>ESP: 201 leitura_id
    end

    Web->>API: GET /hemocentros/:id/alertas?resolvido=false
    API->>DB: SELECT alertas pendentes
    DB-->>API: lista
    API-->>Web: alertas
```

### 3. Campanha

```mermaid
sequenceDiagram
    participant Func as Funcionário
    participant Web as Front Web
    participant API
    participant DB as Supabase
    participant Doador as Doador (app)

    Func->>Web: Cria campanha (tipo, título, mensagem)
    Web->>API: POST /hemocentros/:id/campanhas
    API->>DB: RPC criar_campanha
    Note over DB: INSERT campanha<br/>Loop doadores do tipo<br/>INSERT notificacao para cada
    API-->>Web: 201 total_notificados
    Doador->>API: GET /me/notificacoes
    API-->>Doador: notificação de campanha
```

## Segurança

- **JWT do Supabase** em toda rota autenticada
- **RLS** protege os dados mesmo se a `Publishable key` for obtida (é pública)
- **Service role** só usada no backend (nunca no front/mobile)
- **Validação com Zod** em toda entrada
- **Helmet** + CORS configurável por ambiente
- **`x-powered-by` desabilitado** (reduz fingerprinting)
- **`errorHandler`** não vaza mensagem interna de erro 5xx em produção

## Decisões de arquitetura

Registradas em `docs/adr/`:
- ADR-001: Autenticação via Supabase no cliente
- ADR-002: Acesso ao banco (service role vs JWT)
- ADR-003: Protocolo IoT (HTTP POST em vez de MQTT)
- ADR-004: Deploy (Render + Supabase remoto)
- ADR-005: Notificações (mock estruturado)
- ADR-006: Contrato de API (versionamento e formato de erro)
- ADR-007: Banco local e migrations