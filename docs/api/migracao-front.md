# Guia de migração do front e mobile para o contrato do backend

**Para:** Guilherme (front web + mobile)
**De:** Daniel (backend)
**Data:** 2026-10-29
**Branch de referência do backend:** `main`
**Documento de contrato:** `docs/api/openapi.yaml`

Este guia lista o que precisa ser alterado no front web (`frontend/P-i Web`) e no mobile (`frontend/p-i mobile ofc`) para integrar com o backend do projeto. A ordem segue a prioridade de execução. Itens marcados **[BLOQUEANTE]** impedem qualquer integração.

> **Atualização (2026-10-29):** Todos os endpoints do backend estão implementados e testados.
> O `openapi.yaml` (v1.8.0) está em sincronia com o código. A seção "6. Endpoints que serão
> criados" está **obsoleta** — os 4 endpoints listados lá já existem. Use o `openapi.yaml`
> como fonte de verdade.

---

## 0. Visão geral

Hoje o front e o mobile estão em modo mock (`USAR_MOCK=true`, `USE_MOCK=true`), o que é ótimo para não travar o desenvolvimento das telas. Mas quando os mocks forem desligados, **nenhum endpoint chamado por vocês existe no backend atual**. Este guia alinha os dois lados.

**O que vai mudar em linhas gerais:**

1. Base URL passa a ser `/api/v1`.
2. Login e cadastro passam a usar `supabase-js` direto no cliente (não mais `/auth/login`).
3. Formato de erro padronizado em `{ erro: { codigo, mensagem } }`.
4. Vários endpoints são renomeados/movidos.
5. Cinco novos endpoints serão criados no backend para cobrir telas atuais (item 6 deste guia).

**Decisões já tomadas pelo time:**

- Front web continua em vanilla JS, sem bundler. `supabase-js` entra via CDN.
- Relatórios agregados são **só para funcionário**. Doador vê apenas o próprio histórico.
- Funcionário **não cadastra** doador. Doador se cadastra pelo app; funcionário busca por CPF.
- Notificações são **in-app** (não SMS real). O canal `sms` fica reservado para evolução.

---

## 1. Base URL **[BLOQUEANTE]**

### Front web — `js/config.js`

```js
// ❌ Hoje
export const API_URL = 'http://localhost:3000/api';

// ✅ Novo
export const API_URL = 'http://localhost:3000/api/v1';
```

### Mobile — `src/services/api.ts`

```ts
// ❌ Hoje
const API_URL = 'http://192.168.0.10:3000';

// ✅ Novo
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
```

Crie `.env` no mobile com:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

E adicione `.env` ao `.gitignore`. Para testar em device físico, use o IP da sua máquina na rede local (`http://192.168.x.x:3000/api/v1`) — sempre via variável, nunca hardcoded.

---

## 2. Autenticação via Supabase **[BLOQUEANTE]**

**Hoje:** vocês chamam `POST /auth/login` e `POST /auth/register` no backend.
**Novo:** login e cadastro acontecem **direto no Supabase Auth**, no cliente. O backend só valida o JWT.

Referência: `docs/adr/ADR-001-autenticacao.md`.

### 2.1. Front web — instalar via CDN

Adicione no `<head>` do `index.html` (ou no HTML da tela de login):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Crie `js/supabase.js`:

```js
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_PUBLISHABLE_KEY = '<sb_publishable_...>'; // pegar no `supabase start`

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
```

⚠️ **Nunca** use a chave `Secret` (`sb_secret_...`) no front. Só a `Publishable` (`sb_publishable_...`).

### 2.2. Mobile — instalar via npm

```bash
npm i @supabase/supabase-js
npm i @react-native-async-storage/async-storage
```

Crie `src/lib/supabase.ts`:

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

Crie `.env` com:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
```

### 2.3. Substituir `login()`

```js
// ❌ Hoje (front e mobile)
const res = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, senha })
});
const { token } = await res.json();

// ✅ Novo
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password: senha
});
if (error) throw new Error(error.message);
const token = data.session.access_token;
```

O `supabase-js` já faz refresh automático. Não é preciso gerenciar `sessionStorage`/`AsyncStorage` do token manualmente — o SDK já persiste a sessão.

### 2.4. Substituir cadastro (`POST /usuarios` no front, `POST /auth/register` no mobile)

```js
// ✅ Novo — os dois
// Passo 1: cria conta no Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email,
  password: senha
});
if (error) throw new Error(error.message);

// Passo 2: completa perfil no backend
await fetch(`${API_URL}/me`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.session.access_token}`
  },
  body: JSON.stringify({
    nome_completo: nome,
    cpf: cpf.replace(/\D/g, ''),       // só dígitos
    data_nascimento: '2000-05-10',     // formato YYYY-MM-DD
    sexo: 'F',                         // 'M' | 'F' | 'O'
    tipo_sanguineo: 'O+',
    telefone: '(16) 99999-0000',
    peso: 62.5
  })
});
```

**Remover do formulário:**

- Campo `papel` — no app, quem se cadastra é sempre doador.
- Campo `senha` do envio ao `/me` — senha é gerenciada pelo Supabase.

---

## 3. Formato de erro **[BLOQUEANTE]**

**Hoje:** o front lê `j.mensagem`; o mobile lê `body?.message || body?.erro`.
**Novo:** o backend sempre responde no formato:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Descrição legível",
    "detalhes": {}
  }
}
```

**Criar um helper `apiFetch`** para centralizar (evita repetir em cada tela).

### Front web — `js/http.js` (novo arquivo)

```js
import { API_URL } from './config.js';
import { supabase } from './supabase.js';

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    }),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.erro?.mensagem ?? 'Erro inesperado';
    const err = new Error(msg);
    err.codigo = body?.erro?.codigo;
    err.detalhes = body?.erro?.detalhes;
    throw err;
  }

  return body;
}
```

### Mobile — `src/services/http.ts` (novo arquivo)

```ts
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`
      }),
      ...options.headers
    }
  });

  if (res.status === 204) return null as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.erro?.mensagem ?? 'Erro inesperado';
    throw new Error(msg);
  }

  return body as T;
}
```

Depois, em todas as telas, **substituir `fetch(...)` por `apiFetch(...)`**. O helper já injeta o token e trata erro no formato novo.

---

## 4. Mapa endpoint-por-endpoint (front web)

### 4.1. Estoque

| Antes | Depois |
|---|---|
| `GET /estoque` | `GET /publico/hemocentros/:id/estoque` (público) ou `GET /hemocentros/:id/estoque` (funcionário) |

**Resposta:**

```json
[
  {
    "tipo_sanguineo": "O+",
    "quantidade_bolsas": 30,
    "nivel_minimo": 10,
    "nivel_critico": 5,
    "updated_at": "2026-10-29T12:00:00Z"
  }
]
```

O front precisa saber **qual hemocentro** está consultando. Se for tela pública, `publico`. Se for tela do funcionário logado, `/hemocentros/:id` (valida se o funcionário é do hemocentro).

### 4.2. Câmara fria

| Antes | Depois |
|---|---|
| `GET /camara-fria` | `GET /hemocentros/:id/sensores` + `GET /hemocentros/:id/sensores/:sensorId/leituras?limit=20` |

⚠️ O segundo endpoint **será criado** no backend (item 6.1). Até lá, use o mock. A resposta de `leituras`:

```json
[
  { "created_at": "...", "temperatura": 4.2, "umidade": 62.5, "alerta": false }
]
```

Filtre os sensores por `tipo === 'ambiente'` para a tela de câmara fria.

### 4.3. Alertas

| Antes | Depois |
|---|---|
| `POST /alertas` | **Remover** |

Alertas são **gerados automaticamente** por trigger no banco (estoque baixo/crítico, temperatura/umidade). O front não cria alerta. Ações possíveis:

- `GET /hemocentros/:id/alertas?resolvido=false` — listar pendentes.
- `PATCH /alertas/:id/resolver` — marcar como resolvido.

Se houver botão “criar alerta”, remover. Se houver campo de observação, isso vai em `movimentacoes_estoque.observacao`, não em alerta.

### 4.4. Doadores

| Antes | Depois |
|---|---|
| `POST /doadores` | **Remover** (doador se cadastra pelo app) |
| `GET /doadores/:cpf` | `GET /hemocentros/:id/doadores?cpf=12345678900` |

⚠️ O endpoint de busca **será criado** no backend (item 6.2). Resposta:

```json
{
  "id": "...",
  "nome_completo": "Maria Silva",
  "tipo_sanguineo": "O+",
  "total_doacoes": 3,
  "ultima_doacao": "2026-08-15"
}
```

Se o CPF não existe: HTTP 404 com `{ "erro": { "codigo": "NAO_ENCONTRADO", "mensagem": "Doador não encontrado" } }`.

### 4.5. Doações

| Antes | Depois |
|---|---|
| `POST /doacoes` | `POST /hemocentros/:id/doacoes` |

⚠️ **Será criado** no backend (item 6.3). Payload:

```json
{
  "usuario_id": "uuid-do-doador",
  "tipo_sanguineo": "O+",
  "peso": 62.5,
  "observacao": "opcional"
}
```

Resposta:

```json
{
  "id": "uuid-da-doacao",
  "data_doacao": "2026-10-29",
  "proxima_doacao_permitida": "2027-01-27",
  "movimentacao_id": "uuid-da-movimentacao"
}
```

O backend, internamente, faz:
1. Insere em `doacoes`.
2. Insere em `movimentacoes_estoque` (origem `doacao`).
3. Atualiza `total_doacoes` e `pontos` do doador.
4. Cria notificação `pode_doar` com a data da próxima doação.

### 4.6. Relatórios

| Antes | Depois |
|---|---|
| `GET /relatorios?tipo=media-doacoes&inicio=&fim=` | `GET /hemocentros/:id/relatorios/media-doacoes?inicio=&fim=` |
| `GET /relatorios?tipo=estudo-doadores&inicio=&fim=` | `GET /hemocentros/:id/relatorios/estudo-doadores?inicio=&fim=` |
| `GET /relatorios?tipo=previsao&tipo_sanguineo=&semanas=` | `GET /hemocentros/:id/relatorios/previsao?tipo_sanguineo=&semanas=` |
| `GET /relatorios?tipo=cep&sensor_id=&inicio=&fim=` | `GET /hemocentros/:id/relatorios/cep?sensor_id=&inicio=&fim=` |

Todos exigem JWT de funcionário do hemocentro. As respostas são JSONs estruturados pelas RPCs do banco (já implementadas). Se o front hoje espera um objeto genérico, precisa adaptar cada gráfico ao formato específico de cada endpoint.

**Formatos de resposta** (resumo; detalhes em `openapi.yaml`):

- `media-doacoes`: `{ resumo: { total_doacoes, media_diaria, doadores_unicos }, distribuicao: [{ tipo, quantidade }] }`
- `estudo-doadores`: `{ kpis: { total_doadores, taxa_retorno_pct, ... }, faixas_etarias: [{ faixa, total, retornaram }] }`
- `previsao`: `[{ semana_previsao, demanda_prevista, limite_inferior_95, limite_superior_95, ... }]`
- `cep`: `[{ data_leitura, temperatura, umidade, media_global, limite_controle_superior, limite_controle_inferior, status_ponto }]`

---

## 5. Mapa endpoint-por-endpoint (mobile)

### 5.1. Login e cadastro

Já coberto no item 2.

### 5.2. Hemocentros por cidade

| Antes | Depois |
|---|---|
| `GET /hemocentros/niveis?cidade=&estado=` | `GET /publico/estoque?cidade=` |

⚠️ **Será criado** no backend (item 6.4). Resposta:

```json
[
  {
    "hemocentro": { "id": "...", "nome": "...", "cidade": "Franca", "estado": "SP" },
    "estoque": [
      { "tipo_sanguineo": "O+", "quantidade_bolsas": 30, "nivel_critico": 5, "nivel_minimo": 10 }
    ]
  }
]
```

Uma chamada só, resolve a tela atual sem N+1.

### 5.3. Histórico de doações

| Antes | Depois |
|---|---|
| `GET /doacoes` | `GET /me/doacoes` |

Resposta:

```json
[
  {
    "id": "...",
    "tipo_sanguineo": "O+",
    "data_doacao": "2026-08-15",
    "status": "realizada",
    "hemocentro_id": "..."
  }
]
```

### 5.4. Notificações (tela nova)

- `GET /me/notificacoes` — lista.
- `PATCH /me/notificacoes/:id/lida` — marca como lida.

Resposta:

```json
[
  {
    "id": "...",
    "tipo": "pode_doar",
    "titulo": "Você já pode doar novamente",
    "mensagem": "Faz 60 dias desde sua última doação.",
    "canal": "app",
    "lida": false,
    "created_at": "..."
  }
]
```

### 5.5. Perfil do doador

- `GET /me` — dados do doador logado.
- `PATCH /me` — atualizar dados.

Resposta de `GET /me`:

```json
{
  "id": "...",
  "nome_completo": "Maria Silva",
  "cpf": "12345678900",
  "data_nascimento": "2000-05-10",
  "tipo_sanguineo": "O+",
  "total_doacoes": 3,
  "pontos": 30,
  "ultima_doacao": "2026-08-15"
}
```

---

## 6. Endpoints que serão criados no backend

Estes ainda **não existem**. Estão previstos e serão implementados em ordem de prioridade. Enquanto isso, mantenham o mock.

| # | Endpoint | Para que | Prazo estimado |
|---|---|---|---|
| 6.1 | `GET /hemocentros/:id/sensores/:sensorId/leituras?limit=20` | Tela Câmara Fria | Semana 1 |
| 6.2 | `GET /hemocentros/:id/doadores?cpf=` | Busca de doador na recepção | Semana 1 |
| 6.3 | `POST /hemocentros/:id/doacoes` | Registro de doação pelo funcionário | Semana 1 |
| 6.4 | `GET /publico/estoque?cidade=` | Mobile: hemocentros com estoque agregado | Semana 2 |

**Contrato já definido para cada um** nos itens 4 e 5 deste guia. O `openapi.yaml` será atualizado quando cada endpoint for implementado.

---

## 7. Checklist de execução

Ordem recomendada:

### Passo 1 — Desbloqueio (o que trava tudo)

- [ ] Trocar base URL para `/api/v1` no front e no mobile
- [ ] Instalar `supabase-js` (CDN no front, npm no mobile)
- [ ] Substituir login por `supabase.auth.signInWithPassword`
- [ ] Substituir cadastro por `supabase.auth.signUp` + `PATCH /me`
- [ ] Criar helper `apiFetch` no front e no mobile
- [ ] Substituir todos os `fetch()` por `apiFetch()`
- [ ] Ajustar leitura de erro para `body.erro.mensagem`
- [ ] Remover `POST /alertas`, `POST /doadores`, `POST /auth/*`, `POST /usuarios`

### Passo 2 — Endpoints existentes

- [ ] Adaptar estoque (`/publico/hemocentros/:id/estoque`)
- [ ] Adaptar alertas (`GET /hemocentros/:id/alertas`)
- [ ] Adaptar relatórios (4 endpoints específicos)
- [ ] Mobile: adaptar histórico (`GET /me/doacoes`)
- [ ] Mobile: adicionar tela de notificações (`GET /me/notificacoes`)
- [ ] Mobile: adaptar perfil (`GET /me`)

### Passo 3 — Endpoints novos (após backend entregar)

- [ ] Front: câmara fria usando `6.1`
- [ ] Front: busca de doador usando `6.2`
- [ ] Front: registro de doação usando `6.3`
- [ ] Mobile: lista de hemocentros usando `6.4`

### Passo 4 — Integração real

- [ ] Desligar `USAR_MOCK` e `USE_MOCK`
- [ ] Testar fluxo completo: cadastro → login → consulta → doação → notificação
- [ ] Ajustar o que quebrar

---

## 8. Dúvidas frequentes

**P: Posso usar a `Secret key` no front?**
Não. Ela ignora RLS e dá acesso total ao banco. Só a `Publishable key` (`sb_publishable_...`) vai no front e no mobile. A `Secret` fica só no `.env` do backend.

**P: E se o Supabase local não estiver rodando quando eu testar?**
O login não vai funcionar. Peça ao Daniel para subir ou suba você mesmo com `supabase start` (precisa do Docker). As chaves `Publishable` e `Secret` locais saem do `supabase start`.

**P: E se eu quiser testar em device físico?**
`localhost` não funciona em device físico. Use o IP da sua máquina na rede local (`http://192.168.x.x:54321` para o Supabase, `http://192.168.x.x:3000/api/v1` para o backend). Configure tudo via `.env`.

**P: Preciso migrar o front para Vite?**
Não. Decisão do time: vanilla JS + `supabase-js` via CDN. Vite é evolução futura, não requisito.

**P: Como vejo os endpoints que já existem no backend?**
Abra `docs/api/openapi.yaml`. Ele é a fonte de verdade. Também tem `docs/api/auth-flow.md` e `docs/api/iot-contract.md` com detalhes.

**P: Quem eu procuro se algo não bater?**
Daniel (backend) ou a pessoa da documentação final. O ideal é reportar no grupo com o print do erro e o endpoint chamado.

---

## 9. Referências

- `docs/api/openapi.yaml` — contrato completo
- `docs/adr/ADR-001-autenticacao.md` — por que login é no cliente
- `docs/adr/ADR-006-contrato-api.md` — formato de erro e versionamento
- `docs/api/auth-flow.md` — fluxo de autenticação