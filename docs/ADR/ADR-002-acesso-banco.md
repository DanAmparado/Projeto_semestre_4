# ADR-002 — Acesso ao banco: service role vs JWT

**Status:** Aceita
**Data:** 2026-10-28

## Contexto
O Supabase permite dois modos de acesso: `anon key` com RLS aplicada (via JWT do usuário) ou `service_role key`, que ignora RLS.

## Decisão
- Operações do doador (próprios dados, notificações, histórico) usam o JWT do usuário, respeitando RLS.
- Operações administrativas (gravar leitura IoT, gerar campanhas, chamar RPCs de relatório, resolver alertas) usam service role no servidor, com verificação de autorização feita na própria API.
- `service_role` nunca é exposta no front ou mobile; fica só no `.env` do backend.

## Consequências
- RLS precisa existir e ser testada.
- Toda rota administrativa precisa checar perfil antes de chamar o banco com service role.
- Vazamento de `service_role` é crítico; tratamento no `.env` e `.gitignore`.