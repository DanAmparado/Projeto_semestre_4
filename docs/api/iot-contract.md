# Contrato de Ingestão IoT — Nosso Sangue

Versão: 1.0
Última atualização: 2026-10-28

## 1. Visão geral
Dispositivos ESP32 enviam leituras para a API por HTTP POST. Dois tipos:
- Ambiente: temperatura e umidade da câmara fria.
- Balança: peso de bolsas de um tipo sanguíneo.

A API autentica o device via header `x-iot-key`, valida o `device_id` em `sensores` e grava a leitura. No caso da balança, a API chama a RPC `processar_leitura_balanca`, que calcula delta de peso e gera movimentação de estoque.

## 2. Autenticação
Todas as chamadas devem incluir o header:

```
x-iot-key: <chave-configurada-no-servidor>
```

- Chave definida em `.env` como `IOT_KEY`.
- Sem chave ou chave inválida: HTTP 401.
- Evolução futura: token por device em `sensores.device_id`.

## 3. Identificação do dispositivo
O `device_id` corresponde a `sensores.device_id` no banco (MAC do ESP32 ou identificador único). A API rejeita `device_id` inexistente, inativo ou com `tipo` incompatível com o endpoint.

## 4. POST /api/v1/iot/ambiente

### Request

```
POST /api/v1/iot/ambiente
Content-Type: application/json
x-iot-key: <chave>

{
  "device_id": "ESP32-DHT22-001",
  "temperatura": 4.2,
  "umidade": 62.5
}
```

### Validação
- `device_id`: string não vazia
- `temperatura`: número (mínimo -50, máximo 50)
- `umidade`: número (mínimo 0, máximo 100)

### Resposta 201

```json
{ "ok": true, "leitura_id": 123 }
```

### Erros
- 400 `VALIDACAO`: payload inválido
- 401 `NAO_AUTENTICADO`: chave IoT ausente ou inválida
- 404 `NAO_ENCONTRADO`: device desconhecido ou inativo
- 500 `INTERNO`: falha no banco

### Efeitos colaterais
- Insere em `leituras_ambiente`.
- Trigger `trg_verificar_ambiente` pode gerar alertas de temperatura ou umidade fora da faixa.
- Atualiza `sensores.ultima_comunicacao = now()`.

## 5. POST /api/v1/iot/balanca

### Request

```
POST /api/v1/iot/balanca
Content-Type: application/json
x-iot-key: <chave>

{
  "device_id": "ESP32-BALANCA-O+",
  "peso_kg": 22.500
}
```

### Validação
- `device_id`: string
- `peso_kg`: número maior ou igual a 0

### Resposta 201

```json
{
  "ok": true,
  "movimentacao_detectada": true,
  "tipo": "entrada",
  "bolsas": 2,
  "delta_peso_kg": 0.95
}
```

Primeira leitura do device:

```json
{ "ok": true, "primeira_leitura": true }
```

Variação menor que o ruído configurado:

```json
{ "ok": true, "movimentacao_detectada": false }
```

### Erros
- 400 `VALIDACAO`
- 401 `NAO_AUTENTICADO`
- 404 `NAO_ENCONTRADO`: device desconhecido, inativo ou que não é balança
- 500 `INTERNO`

### Efeitos colaterais
- Chama RPC `processar_leitura_balanca`.
- A RPC insere em `leituras_balanca`, calcula delta, cria `movimentacoes_estoque`, atualiza `estoque_sangue` via trigger e atualiza `sensores.ultima_comunicacao`.

## 6. Exemplos com curl

Ambiente:

```bash
curl -X POST http://localhost:3000/api/v1/iot/ambiente \
  -H "Content-Type: application/json" \
  -H "x-iot-key: dev-iot-key-123" \
  -d '{"device_id":"ESP32-DHT22-001","temperatura":4.2,"umidade":62.5}'
```

Balança:

```bash
curl -X POST http://localhost:3000/api/v1/iot/balanca \
  -H "Content-Type: application/json" \
  -H "x-iot-key: dev-iot-key-123" \
  -d '{"device_id":"ESP32-BALANCA-O+","peso_kg":22.5}'
```

## 7. Comportamento esperado no ESP32
- Envio a cada 30s para ambiente, a cada 10s para balança (ajustável).
- Retry com backoff exponencial em caso de 5xx.
- Não fazer retry em 400, 401 ou 404 (erro de configuração).
- Manter o `device_id` fixo no firmware.

Pseudocódigo:

```cpp
void loop() {
  float t = readTemperature();
  float u = readHumidity();
  postJson("/api/v1/iot/ambiente",
           {"device_id": DEVICE_ID, "temperatura": t, "umidade": u});
  delay(30000);
}
```

## 8. Compatibilidade
- Este contrato é a fonte de verdade para o firmware e para o backend.
- Mudanças exigem atualização simultânea deste documento e do `openapi.yaml`.