# ADR-004 — Onde o backend roda

**Status:** Aceita
**Data:** 2026-10-28

## Contexto
Precisamos escolher onde hospedar a API para integração e para o vídeo de demonstração.

## Decisão
- Ambiente de desenvolvimento local via Docker (Supabase CLI) por desenvolvedor.
- Ambiente de integração/demo: Render (free tier) ou Railway.
- Banco de integração: projeto Supabase remoto do grupo, alimentado por `supabase db push` a partir das migrations.

## Consequências
- Dev não depende do banco remoto para trabalhar.
- Migrations são a fonte de verdade do schema.
- O deploy de demonstração precisa de configuração de CORS e variáveis de ambiente.