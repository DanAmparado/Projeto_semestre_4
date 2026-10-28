# Fluxo de autenticação — Nosso Sangue

## Visão geral
- Autenticação: Supabase Auth (GoTrue).
- Login: direto no cliente (React / React Native) com `supabase-js`.
- Autorização na API: JWT validado em toda rota protegida.
- Dados do doador: linha em `public.usuarios` ligada a `auth.users(id)`.

## Fluxo de cadastro (doador)

```
[Mobile] supabase.auth.signUp({ email, password })
   │
   ▼
[Supabase Auth] cria usuário em auth.users
   │
   ▼
[Trigger] handle_new_user() cria linha em public.usuarios (id = auth.uid())
   │
   ▼
[Mobile] chama POST /api/v1/me (com JWT) para completar cadastro:
  nome_completo, cpf, data_nascimento, sexo, tipo_sanguineo, telefone, peso
   │
   ▼
[API] valida e atualiza public.usuarios
```

## Fluxo de login

```
[Cliente] supabase.auth.signInWithPassword({ email, password })
   │
   ▼
[Supabase Auth] retorna access_token (JWT) + refresh_token
   │
   ▼
[Cliente] guarda sessão (supabase-js cuida do refresh)
   │
   ▼
[Cliente] em toda chamada à API: Authorization: Bearer <access_token>
   │
   ▼
[API] supabase.auth.getUser(token) → valida → injeta req.user
```

## Middleware de auth (backend)

```ts
// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../lib/supabase';

export async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Token ausente' }
    });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Token inválido' }
    });
  }

  (req as any).user = data.user;
  next();
}
```

## Autorização por perfil
- Doador: tem linha em `public.usuarios`. Acesso a `/me/*`.
- Funcionário: tem linha em `public.hemocentro_usuarios`. Acesso a `/hemocentros/:id/*` do próprio hemocentro.
- Verificação: a API consulta `hemocentro_usuarios` com `user_id = req.user.id` e `hemocentro_id = :id` antes de prosseguir.

Middleware sugerido:

```ts
// src/middlewares/autorizarFuncionario.ts
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export async function autorizarFuncionario(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const hemocentroId = req.params.id;
  const user = (req as any).user;

  const { data, error } = await supabaseAdmin
    .from('hemocentro_usuarios')
    .select('role, ativo')
    .eq('user_id', user.id)
    .eq('hemocentro_id', hemocentroId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return res.status(403).json({
      erro: {
        codigo: 'NAO_AUTORIZADO',
        mensagem: 'Sem acesso a este hemocentro'
      }
    });
  }

  (req as any).funcionario = data;
  next();
}
```

## Rotas públicas
- `GET /api/v1/health`
- `GET /api/v1/publico/hemocentros`
- `GET /api/v1/publico/hemocentros/:id/estoque`
- `POST /api/v1/iot/ambiente` e `POST /api/v1/iot/balanca` (autenticação via `x-iot-key`)

## Refresh e expiração
- `supabase-js` renova o token automaticamente.
- A API trata 401 com `NAO_AUTENTICADO`; o cliente dispara refresh ou logout.
- Não há endpoint de refresh na API; isso é responsabilidade do `supabase-js`.

## Mock para front/mobile antes do backend pronto
- Front/mobile pode usar `supabase.auth` real no projeto de dev (funciona sem a API).
- Para chamadas à API, usar mocks (Prism, json-server ou MSW) baseados no `openapi.yaml`.
- Contrato de auth fechado: JWT no header `Authorization`, formato de erro padronizado.