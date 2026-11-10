# Tarefas — Backend

**Data:** 2026-11-10
**Responsável:** Daniel Lemos
**Contexto geral:** projeto está em produção estável. Estas são melhorias e features para alinhar o fluxo de acesso entre web (só funcionário) e mobile (só doador).

## Prioridades

- **P0:** bloqueia experiência na demo
- **P1:** necessário antes da entrega
- **P2:** polimento / opcional

## Resumo

| # | Tarefa | Prioridade | Tempo | Bloqueia |
|---|---|---|---|---|
| 1 | `GET /me/papel` | P1 | 10 min | Front Web (#1) |
| 2 | `POST /hemocentros/:id/doadores` | P1 | 20 min | Front Web (#5) |
| 3 | Atualizar `docs/api/openapi.yaml` | P1 | 10 min | — |
| 4 | Migration `0024` (otimização RLS) | P2 | 5 min | — |

---

## 1. `GET /me/papel` — P1

**Problema:** o front web não distingue funcionário de doador. Hoje qualquer usuário do Supabase Auth consegue logar no painel e o doador vê 403 em tudo.

**Solução:** endpoint que responde o papel do usuário logado.

### Arquivos

**`backend/src/services/me.service.ts`** (adicionar):

```ts
export async function getPapel(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('hemocentro_usuarios')
    .select('hemocentro_id, role')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();

  if (error) throw Internal(error.message);

  if (!data) {
    return { eh_funcionario: false, hemocentro_id: null, role: null };
  }

  return {
    eh_funcionario: true,
    hemocentro_id: data.hemocentro_id,
    role: data.role,
  };
}
```

**`backend/src/routes/me.routes.ts`** (adicionar depois do `GET /`):

```ts
router.get('/papel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const papel = await getPapel(req.user!.id);
    res.json(papel);
  } catch (err) {
    next(err);
  }
});
```

Adicionar `getPapel` no import de `me.service`.

### Teste

```bash
# Login como funcionário
TOKEN=$(curl -s -X POST "https://qspukyphnexyrhltabel.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: <publishable>" \
  -d '{"email":"funcionario@test.local","password":"senha123"}' | \
  jq -r '.access_token')

curl "https://nosso-sangue-api.onrender.com/api/v1/me/papel" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado:** `{"eh_funcionario":true,"hemocentro_id":"11111111-...","role":"admin"}`

```bash
# Login como doador
TOKEN=$(curl -s -X POST "https://qspukyphnexyrhltabel.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: <publishable>" \
  -d '{"email":"maria.doadora@test.local","password":"senha123"}' | \
  jq -r '.access_token')

curl "https://nosso-sangue-api.onrender.com/api/v1/me/papel" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado:** `{"eh_funcionario":false,"hemocentro_id":null,"role":null}`

---

## 2. `POST /hemocentros/:id/doadores` — P1

**Problema:** o fluxo "funcionário cria conta de doador na recepção" está usando `supabase.auth.signUp()` no front, que **substitui a sessão do funcionário** pelo novo usuário. Além disso, não há como o backend validar que é um funcionário criando.

**Solução:** endpoint autenticado que usa Admin API do Supabase (`service_role`) para criar conta, sem mexer na sessão do funcionário.

### Schema

**`backend/src/schemas/doadores.schema.ts`** (adicionar):

```ts
export const criarDoadorBodySchema = z.object({
  nome_completo: z.string().min(1).max(200),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  sexo: z.enum(['M', 'F', 'O']),
  tipo_sanguineo: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  telefone: z.string().max(20),
  email: z.string().email(),
  peso: z.number().min(30).max(300).optional(),
});

export type CriarDoadorBody = z.infer<typeof criarDoadorBodySchema>;
```

### Service

**`backend/src/services/doadores.service.ts`** (adicionar):

```ts
function gerarSenhaTemporaria(): string {
  // 8 caracteres, sem ambíguos (0, O, I, l)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s.slice(0, 4) + '-' + s.slice(4);
}

export async function criarDoadorPeloFuncionario(body: CriarDoadorBody) {
  const senhaTemp = gerarSenhaTemporaria();

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: senhaTemp,
    email_confirm: true,
    user_metadata: {
      nome_completo: body.nome_completo,
      cpf: body.cpf,
      data_nascimento: body.data_nascimento,
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('duplicate')) {
      throw Conflict('Email já cadastrado');
    }
    throw Internal(error.message);
  }

  // Complementa o perfil na tabela usuarios
  const { error: updError } = await supabaseAdmin
    .from('usuarios')
    .update({
      sexo: body.sexo,
      tipo_sanguineo: body.tipo_sanguineo,
      telefone: body.telefone,
      peso: body.peso ?? null,
    })
    .eq('id', authUser.user.id);

  if (updError) throw Internal(updError.message);

  return {
    id: authUser.user.id,
    email: body.email,
    senha_temporaria: senhaTemp,
  };
}
```

Adicionar `Conflict` no import de `httpErrors`.

### Rota

**`backend/src/routes/doadores.routes.ts`** (adicionar):

```ts
router.post(
  '/:id/doadores',
  auth,
  validateParams(hemocentroIdParamSchema),
  autorizarFuncionario,
  validateBody(criarDoadorBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await criarDoadorPeloFuncionario(req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);
```

Adicionar imports de `criarDoadorBodySchema` e `criarDoadorPeloFuncionario`.

### Teste

```bash
curl -X POST "https://nosso-sangue-api.onrender.com/api/v1/hemocentros/11111111-1111-1111-1111-111111111111/doadores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_FUNCIONARIO" \
  -d '{
    "nome_completo":"Teste Doador",
    "cpf":"98765432100",
    "data_nascimento":"1990-05-15",
    "sexo":"M",
    "tipo_sanguineo":"O+",
    "telefone":"(16) 99999-8888",
    "email":"teste.doador@exemplo.com",
    "peso":75.0
  }'
```

**Esperado:** `{"id":"<uuid>","email":"teste.doador@exemplo.com","senha_temporaria":"ABCD-1234"}`

**Verificações:**
- Conta criada em `auth.users` (Supabase Dashboard)
- Linha em `public.usuarios` com tipo O+ e telefone
- Login no mobile com o e-mail + senha temporária funciona

**Erros esperados:**
- Email duplicado → `409 CONFLITO`
- CPF duplicado (se já em `usuarios`) → `409 CONFLITO` (via constraint)
- Sem token ou não funcionário → `401` / `403`

---

## 3. Atualizar `docs/api/openapi.yaml` — P1

Adicionar no `paths`:

- `GET /me/papel` (já especificado na conversa)
- `POST /hemocentros/{id}/doadores` (o `GET` existe; adicionar o `POST` no mesmo path)

Bump `info.version` para `2.0.0` (as rotas novas não são breaking, mas o endpoint de papel é novo conceito de auth).

Commit:

```bash
git add backend/ docs/api/openapi.yaml
git commit -F - <<'EOF'
feat(backend): endpoints para fluxo de acesso web (funcionário) e mobile (doador)

- GET /me/papel: retorna se o usuário logado é funcionário
- POST /hemocentros/:id/doadores: funcionário cria conta de doador
  via Admin API (senha temporária), sem substituir a sessão
- OpenAPI v2.0.0
EOF
git push origin main
```

---

## 4. Migration `0024` — otimização RLS — P2

**Problema:** 11 warnings do Advisor sobre `auth.uid()` avaliado linha por linha nas policies.

**Solução:** migration `0024_otimiza_rls_initplan.sql` (conteúdo já na conversa) que substitui `auth.uid()` por `(select auth.uid())` em todas as policies.

**Aplicar só depois da entrega**, é opcional. Não bloqueia nada.

---

## O que NÃO mexer

- 28 endpoints existentes (funcionam)
- RPCs `criar_campanha`, `registrar_doacao`, `processar_leitura_balanca` (testadas)
- Migrations `0001` a `0023` (aplicadas)
- Triggers e RLS existentes
- Swagger (`/docs`)

## Checklist final

- [ ] `GET /me/papel` retorna papel correto para funcionário e doador
- [ ] `POST /hemocentros/:id/doadores` cria conta e retorna senha temporária
- [ ] Erro 409 para email duplicado
- [ ] `openapi.yaml` atualizado e commitado
- [ ] `./backend/scripts/smoke-test.sh` continua 12/12
- [ ] Render redeployou sem erro

## Dependências para outros times

- **Front Web** precisa de #1 para bloquear doador no login, e de #2 para reescrever `novo-cadastro`
- **DevOps** precisa da URL de produção para testes