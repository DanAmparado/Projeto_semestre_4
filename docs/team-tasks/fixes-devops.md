# Tarefas — DevOps / Infra

**Data:** 2026-11-10
**Responsável:** Daniel Lemos
**Contexto geral:** eliminar cold start do Render, verificar config do Supabase Auth, e preparar redirect do reset de senha.

## Prioridades

- **P0:** bloqueia experiência na demo
- **P1:** necessário antes da entrega
- **P2:** polimento

## Resumo

| # | Tarefa | Prioridade | Tempo | Depende de |
|---|---|---|---|---|
| 1 | UptimeRobot pingando `/health` | **P0** | 5 min | — |
| 2 | Verificar Single Session / Refresh Rotation no Supabase | P1 | 5 min | — |
| 3 | Configurar Redirect URL para reset password | P1 | 2 min | Front #7 |
| 4 | Verificar rate limit de email | P2 | 2 min | — |
| 5 | (opcional) Upgrade Render Starter | P2 | 2 min | — |

---

## 1. UptimeRobot — P0

**Problema:** Render free tier hiberna após ~15 min sem tráfego. Primeira request depois disso demora 20–35s, o que causa tela branca no mobile e lentidão no web.

**Solução:** monitor externo pingando `/health` a cada 5 min. Backend nunca dorme.

### Passo a passo

1. Criar conta em [uptimerobot.com](https://uptimerobot.com) (free, sem cartão)
2. **Add New Monitor** → **HTTP(s)**
3. Preencher:
   - **Friendly Name:** `Nosso Sangue API`
   - **URL:** `https://nosso-sangue-api.onrender.com/api/v1/health`
   - **Monitoring Interval:** `5 minutes` (mínimo free)
4. **Create Monitor**

### Verificação

Depois de 10 min, o painel do Render deve mostrar "Last deploy live" e o `curl` de health deve responder em <500ms mesmo depois de tempo sem uso.

```bash
time curl https://nosso-sangue-api.onrender.com/api/v1/health
```

**Esperado:** menos de 1 segundo sempre (não mais 20–35s).

**Custo:** $0. **Efeito:** elimina o cold start 100%.

---

## 2. Verificar Single Session / Refresh Rotation — P1

**Problema:** o app mobile expira a sessão às vezes sem motivo aparente (após login no web, ou após horas em background).

**Solução:** verificar 2 configs do Supabase que podem causar isso.

### Passo a passo

No [Supabase Dashboard](https://supabase.com/dashboard/project/qspukyphnexyrhltabel/auth/settings):

**Config 1 — User Sessions**

Authentication → **Settings → User Sessions**:

- **"Single session per user"** está ON ou OFF?
  - Se **ON**: cada novo login derruba a sessão anterior. Web e mobile do mesmo usuário conflitam.
  - **Ação:** desativar se estiver ON (a menos que seja intencional).

**Config 2 — Refresh Token Rotation**

Authentication → **Settings → Sessions**:

- **"Refresh token rotation"** está ON ou OFF?
- **"Reuse interval"** — qual valor? (padrão é 10 segundos)

Se `Reuse interval = 0`, o Supabase revoga toda a família de tokens no primeiro reuse. Isso afeta o mobile quando volta do background depois de horas.

- **Ação:** se estiver `0`, mudar para `10` ou `30` segundos.

**Config 3 — JWT Expiry**

Authentication → **Settings → Sessions**:

- **"Access token (JWT) expiry"** — padrão é 3600s (1h). Se o refresh falhar, a sessão expira em 1h.

### Verificação

```bash
# No Supabase Dashboard → Authentication → Users → [usuário] → Sessions
```

Cada usuário deve ter **1 sessão ativa por dispositivo** (web + mobile = 2). Se aparecer mais ou aparecer `revoked` sem motivo claro, é sinal de config restritiva.

### Reportar

Independente do resultado, documentar em `docs/deploy.md`:

```markdown
### Config de sessão atual

- Single Session per user: [ON/OFF]
- Refresh token rotation: [ON/OFF]
- Reuse interval: [X segundos]
- JWT expiry: [X segundos]

Mudanças feitas em 2026-11-10:
- [descrever qualquer alteração]
```

---

## 3. Configurar Redirect URL para reset de senha — P1

**Problema:** o fluxo de reset de senha do Supabase precisa de uma URL autorizada para redirecionar após o clique no email. Sem isso, o link retorna erro ou redireciona para lugar errado.

### Passo a passo

**Bloqueado pela tarefa #7 do `front-mobile.md`** — a página `reset-password.html` precisa existir no Vercel para a URL funcionar.

Depois que `front-mobile.md #7` estiver deployado:

1. No [Supabase Dashboard](https://supabase.com/dashboard/project/qspukyphnexyrhltabel/auth/url-configuration):
2. **Authentication → URL Configuration → Redirect URLs**
3. **Add URL** → adicionar:
   ```
   https://nosso-sangue.vercel.app/pages/reset-password.html
   ```
4. **Save**

### Verificação

```bash
# Testar enviando email de reset
curl -X POST "https://qspukyphnexyrhltabel.supabase.co/auth/v1/recover" \
  -H "Content-Type: application/json" \
  -H "apikey: <publishable>" \
  -d '{"email":"seed01@test.local"}'
```

Depois do email chegar:
- Abrir o link no navegador
- Deve cair em `https://nosso-sangue.vercel.app/pages/reset-password.html` com o token na URL
- Se cair em `localhost` ou em página de erro, a Redirect URL está errada.

---

## 4. Verificar rate limit de email — P2

**Problema:** o Supabase free tier limita a 2 emails/hora (`over_email_send_rate_limit`). Já vimos esse erro no signup web.

**Verificação:**

Authentication → **Settings → Rate Limits → Email**:

- **"Email auth"** — quantos emails por hora?
- Padrão: 2/hora

**Ações possíveis:**

- **Para desenvolvimento:** desativar "Confirm email" (já feito, mas confirmar que continua OFF)
- **Para produção (se quiser manter confirmação):** configurar SMTP próprio:
  - [Resend](https://resend.com) — 100 emails/dia grátis
  - [SendGrid](https://sendgrid.com) — 100 emails/dia grátis
  - Configurar em Authentication → **SMTP Settings → Custom SMTP**

**Recomendação:** manter **Confirm email = OFF** durante o semestre (o PI não exige confirmação). Se quiser reativar antes da entrega, configurar SMTP primeiro.

---

## 5. (Opcional) Upgrade do Render para Starter — P2

**Problema:** free tier hiberna, tem 512MB de RAM, e compartilha CPU com outros serviços.

**Solução:** plano Starter a $7/mês elimina o cold start **sem precisar do UptimeRobot** e garante CPU dedicada.

**Recomendação:** **não fazer agora**. O UptimeRobot resolve 100% do problema de cold start por $0. Considerar apenas se a demo travar por outro motivo (CPU throttling durante picos).

---

## Checklist final

- [ ] UptimeRobot configurado e monitor mostrando verde há >10 min
- [ ] Verificado e documentado: Single Session, Refresh Rotation, JWT Expiry
- [ ] Redirect URL `reset-password.html` adicionada no Supabase
- [ ] "Confirm email" OFF (ou SMTP configurado se ON)
- [ ] `time curl https://nosso-sangue-api.onrender.com/api/v1/health` retorna <1s

## O que NÃO mexer

- Render build/start commands (estáveis)
- Migrations aplicadas
- RLS policies
- Env vars do Render (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, IOT_KEY)

## Custos

| Serviço | Plano | Custo |
|---|---|---|
| Render | Free | $0 (com UptimeRobot) |
| Supabase | Free | $0 |
| Vercel | Free | $0 |
| UptimeRobot | Free | $0 |

**Total:** $0/mês. O upgrade opcional do Render para $7/mês é a única otimização paga considerada.