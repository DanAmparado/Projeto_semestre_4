# ADR-001 — Autenticação de doadores e funcionários

**Status:** Aceita
**Data:** 2026-10-28

## Contexto
Precisamos de login para doadores (mobile) e funcionários (web).
O Supabase Auth já oferece signup, login, refresh, reset de senha e JWT.

## Decisão
- Login e cadastro são feitos direto no cliente (React e React Native) usando `supabase-js` com `anon key`.
- A API recebe o JWT no header `Authorization: Bearer <token>` e valida com `supabase.auth.getUser(token)`.
- A API não emite token próprio e não faz login.
- Após o signup, um trigger no banco cria a linha em `public.usuarios` (ou o usuário completa em `POST /me`).

## Consequências
- Menos código no backend, menos superfície de ataque.
- O backend precisa validar o JWT em toda rota privada.
- O front precisa lidar com refresh token (o `supabase-js` já faz isso).
- Autorização de funcionário é checada na API consultando `hemocentro_usuarios`.