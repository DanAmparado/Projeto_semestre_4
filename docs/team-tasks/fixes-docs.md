# Tarefas — Documentação

**Data:** 2026-11-10
**Responsável:** Membro da documentação
**Contexto geral:** atualizar documentos que ficaram desatualizados e criar novos guias para evitar surpresas operacionais.

## Prioridades

- **P0:** bloqueia experiência na demo
- **P1:** necessário antes da entrega
- **P2:** polimento

## Resumo

| # | Tarefa | Prioridade | Tempo | Depende de |
|---|---|---|---|---|
| 1 | `iot/readme.md`: Next.js → Vercel CDN | P2 | 2 min | — |
| 2 | `docs/deploy.md`: cold start + auth troubleshooting | P2 | 15 min | DevOps #1, #2 |
| 3 | `docs/workflow-merge.md` (novo) | P2 | 10 min | — |
| 4 | Atualizar `docs/apresentacao.md` (se mudou fluxo) | P2 | 10 min | Front/Mobile #5–#10 |

---

## 1. `iot/readme.md` — corrigir referência a Next.js — P2

**Problema:** o README do time de IoT, na seção de troubleshooting, tem:

> "Dashboard não atualiza (Vercel): O Next.js faz cache das páginas por padrão. Solução: adicione `export const dynamic = 'force-dynamic';` no topo da página do dashboard ou force o recarregamento com Ctrl + F5."

O front **não é Next.js**. É HTML + CSS + JS puro (sem build).

**Correção sugerida:**

```markdown
### Dashboard não atualiza no Vercel

O Vercel pode cachear assets estáticos no CDN. Se o dashboard mostrar dados antigos:

1. Hard reload no browser: `Ctrl+Shift+R`
2. Ou aguarde ~1 min após um deploy (invalidação do CDN)
3. Se persistir, verifique se o backend no Render está acordado (cold start de 30s):
   `curl https://nosso-sangue-api.onrender.com/api/v1/health`
```

---

## 2. `docs/deploy.md` — adicionar cold start + auth — P2

**Problema:** o documento atual não cobre 2 problemas que apareceram hoje:
- Cold start do Render (30s na primeira request após hibernação)
- Fluxo de autenticação (doador vs funcionário, web vs mobile)

**Adicionar seções:**

### Seção "Cold start do Render"

```markdown
### Cold start do Render (~30s na primeira request)

O free tier hiberna o backend após ~15 min sem tráfego. A primeira request
depois disso demora 20–35s.

**Soluções:**

1. **UptimeRobot (recomendado)**: monitor HTTP a cada 5 min apontando para
   `https://nosso-sangue-api.onrender.com/api/v1/health`. Mantém o servidor quente 24/7.

2. **Aquecer manualmente**: antes de abrir o app ou gravar demo, executar:
   `curl https://nosso-sangue-api.onrender.com/api/v1/health`

3. **Plano Starter ($7/mês)**: o Render pago não hiberna. Opcional.
```

### Seção "Autenticação — quem entra onde"

```markdown
### Autenticação — web vs mobile

| Plataforma | Quem entra | Cadastro |
|---|---|---|
| **Web** (`nosso-sangue.vercel.app`) | Apenas funcionário do hemocentro | Funcionário cria conta de doador na recepção (senha temporária) |
| **Mobile** (Expo Go) | Apenas doador | Autocadastro com senha escolhida |

**Funcionário se cadastra?** Não pelo web. É criado via Admin API do Supabase
(ver `docs/dev/funcionario-teste.md`) ou por outro admin da recepção.

**Como criar funcionário do zero:**

```bash
curl -X POST "https://qspukyphnexyrhltabel.supabase.co/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: <secret-key>" \
  -H "Authorization: Bearer <secret-key>" \
  -d '{"email":"novo@hemocentro.com","password":"senha123","email_confirm":true}'
```

Depois vincular em `hemocentro_usuarios` com role `admin`/`operador`/`visualizador`.

**Reset de senha (doador e funcionário):**
- Doador: botão "Esqueci minha senha" no app → email → `reset-password.html`
- Funcionário: botão "Esqueci minha senha" no login web → mesmo fluxo

**Problemas comuns de auth:**

| Erro | Causa | Solução |
|---|---|---|
| `429 over_email_send_rate_limit` no signup | Limite de 2 emails/hora do free tier | Desativar "Confirm email" no Dashboard (dev) ou configurar SMTP próprio |
| Doador consegue logar no web | Falta `guardFuncionario()` no front | Aplicar fixes do `front-mobile.md` #5–#7 |
| Web "vira" outro usuário ao criar doador | `signUp` substitui a sessão | Aplicar backend #2 (`POST /hemocentros/:id/doadores`) |
```

---

## 3. `docs/workflow-merge.md` — criar — P2

**Conteúdo sugerido:**

```markdown
# Workflow de merge

Passo a passo para integrar branches novas na `main` com segurança.

## 1. Diagnóstico

```bash
git fetch origin
git branch -a
git log --oneline origin/main..origin/<branch-nova>
git diff --stat origin/main..origin/<branch-nova>
```

Confere:
- Quantos commits e arquivos
- Se faz sentido com o nome da branch

## 2. Verificação de segurança

```bash
# Segredos
git diff origin/main..origin/<branch-nova> | grep -iE "sb_secret_|service_role|IOT_KEY\s*=\s*\"[A-Za-z0-9+/=]{20,}"

# .env real
git diff --name-only origin/main..origin/<branch-nova> | grep -E "\.env$"

# Arquivos inesperados
git diff --name-only origin/main..origin/<branch-nova> | grep -vE "\.(png|jpg|jpeg|svg|webp|gif|html|css|js|ts|tsx|json|md)$"
```

Todos devem retornar vazio (ou só placeholders).

## 3. Simular o merge

```bash
git checkout main && git pull origin main
git merge --no-commit --no-ff origin/<branch-nova>
```

Se der conflito, resolver manualmente. Se não, seguir.

## 4. Revisar o que entrou

```bash
git diff --cached --stat
```

Confere se é só o esperado.

## 5. Testar localmente

```bash
# Backend (se tocar)
cd backend && npm install && npm run build && cd ..

# Mobile (se tocar)
cd "frontend/p-i mobile ofc" && npx tsc --noEmit && cd ../..

# Web (se tocar)
grep -rn "USAR_MOCK" frontend/P-I-web/js/*.js  # deve ser false
```

## 6. Commit

```bash
git commit -F - <<'EOF'
merge: <branch-nova>

<resumo do que entrou>
EOF
```

## 7. Push e deploy

```bash
git push origin main
```

Aguarda ~2 min (Render + Vercel redeploy automático).

## 8. Validar produção

```bash
./backend/scripts/smoke-test.sh
```

Esperado: 12/12.

## 9. Limpeza

```bash
git push origin --delete <branch-nova>
```
```

---

## 4. Atualizar `docs/apresentacao.md` (se o roteiro mudou) — P2

Verificar se o roteiro do vídeo ainda reflete o fluxo atual:
- Web: login funcionário → dashboard → doador → registrar doação → campanha → relatórios
- Mobile: login doador → consulta → perfil → notificações
- IoT: Wokwi/Cirkit enviando leituras

Se o fluxo de cadastro mudou (funcionário cria doador com senha temporária), atualizar o roteiro do bloco de "cadastro".

---

## O que NÃO mexer

- `docs/api/openapi.yaml` (é gerado pelo backend)
- `docs/adr/` (decisões históricas, mantêm como estão)
- `docs/arquitetura.md` (não mudou)

## Checklist final

- [ ] `iot/readme.md` sem referência a Next.js
- [ ] `docs/deploy.md` com seção de cold start e auth
- [ ] `docs/workflow-merge.md` criado
- [ ] `docs/apresentacao.md` atualizado (se necessário)