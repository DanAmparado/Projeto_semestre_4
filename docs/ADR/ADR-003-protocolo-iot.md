# ADR-003 — Protocolo de ingestão IoT

**Status:** Aceita
**Data:** 2026-10-28

## Contexto
A proposta original menciona MQTT; o banco implementa RPC via HTTP.
Precisamos escolher o caminho mais simples que cumpra o requisito do 4º semestre.

## Decisão
- ESP32 envia leituras por HTTP POST para a API (`/api/v1/iot/ambiente` e `/api/v1/iot/balanca`).
- Autenticação por header `x-iot-key` (uma chave global no PI, com evolução para token por device).
- A API valida `device_id`, status do sensor e tipo antes de gravar.
- A balança chama a RPC `processar_leitura_balanca`; o ambiente usa trigger `trg_verificar_ambiente`.
- MQTT fica documentado como evolução futura, não como requisito do PI.

## Consequências
- Menos infraestrutura (sem broker).
- Facilita demo e testes com `curl`/Postman.
- Não cobre qualidade de serviço de MQTT (QoS, retenção), mas é suficiente para o escopo.