# Integração Wokwi — Simulação IoT ao Backend Nosso Sangue

**Última atualização:** 2026-11-07
**Responsável pelo backend:** Daniel Lemos
**Time de IoT:** Carolina Carneiro
**Simulação atual (Blynk):** https://wokwi.com/projects/476997550075436033

---

## 1. Objetivo

Conectar a simulação ESP32 do Wokwi (DHT22 + 8 balanças HX711) ao backend em produção do projeto Nosso Sangue, **substituindo o broker MQTT do Blynk por chamadas HTTP diretas**.

A lógica de negócio do sketch (regras de refrigeração automática, alerta de estoque crítico, leitura não bloqueante das balanças) **permanece intacta**. Só muda o transporte de dados.

---

## 2. Arquitetura

```
┌─────────────────┐      HTTP POST (JSON)      ┌──────────────────────┐
│  Wokwi (ESP32)  │ ─────────────────────────> │  Backend (Render)    │
│  DHT22 + HX711  │   Header: x-iot-key        │  /api/v1/iot/...     │
└─────────────────┘                            └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  Supabase (Postgres) │
                                               │  leituras_ambiente   │
                                               │  leituras_balanca    │
                                               │  alertas (trigger)   │
                                               └──────────────────────┘
```

- **Wokwi:** simula o hardware e se conecta à internet via rede virtual `Wokwi-GUEST`.
- **Backend:** API REST no Render valida o header `x-iot-key`, grava a leitura e dispara triggers.
- **Banco:** Supabase armazena leituras e gera alertas automáticos (temperatura fora da faixa 2–6 °C e estoque ≤ 5 bolsas).

---

## 3. Credenciais necessárias

> ⚠️ **Estas informações devem ser obtidas com o Daniel (backend). Nunca commitar `IOT_KEY` no repositório.**

| Variável | Descrição | Onde encontrar |
|---|---|---|
| `API_BASE_URL` | URL do backend em produção | `https://nosso-sangue-api.onrender.com/api/v1` |
| `IOT_KEY` | Chave de autenticação dos dispositivos IoT | Painel do Render → `nosso-sangue-api` → Environment → `IOT_KEY` |
| `DEVICE_ID_AMBIENTE` | Identificador do sensor de ambiente | `ESP32-DHT22-001` (fixo, já cadastrado no banco) |
| `DEVICE_ID_BALANCA` | Identificador da balança | `ESP32-BALANCA-O+` (fixo, já cadastrado no banco) |

**Observação:** o backend no plano free do Render **hiberna após 15 min sem uso**. Antes de iniciar a simulação, "acorde" o backend:

```bash
curl https://nosso-sangue-api.onrender.com/api/v1/health
```

Se demorar mais de 10 segundos, é o cold start. Aguarde retornar `{"ok":true,...}` e siga.

---

## 4. Bibliotecas necessárias (Wokwi)

O `libraries.txt` deve conter:

```
DHT sensor library
Adafruit Unified Sensor
ESP32Servo
HX711 Arduino Library
```

**Remover** (não são mais necessárias):
- `PubSubClient` — o Blynk/MQTT foi substituído por HTTP

`WiFi.h`, `HTTPClient.h` e `WiFiClientSecure.h` já vêm com o ESP32 core (não precisam de biblioteca externa).

---

## 5. Sketch adaptado (`sketch.ino`)

Substitua o arquivo do Wokwi por este. **Só foram alterados**: as bibliotecas, o bloco de constantes do Blynk (viraram constantes do backend), as duas funções de envio e o ciclo do `loop()`. O resto (servo, buzzer, DHT, HX711, lógica de refrigeração e alerta) está **idêntico** ao original.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <HX711.h>

// ---------- Wi-Fi (rede simulada do Wokwi) ----------
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ---------- Backend Nosso Sangue ----------
const char* API_BASE_URL = "https://nosso-sangue-api.onrender.com/api/v1";
const char* IOT_KEY      = "COLE_AQUI_A_IOT_KEY_DO_RENDER";

const char* DEVICE_ID_AMBIENTE = "ESP32-DHT22-001";
const char* DEVICE_ID_BALANCA   = "ESP32-BALANCA-O+";

// ---------- Tipos sanguíneos ----------
#define NUM_TIPOS 8
const char* NOMES_TIPOS[NUM_TIPOS] = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};

// ---------- Pinos ----------
#define DHT_PIN              15
#define DHT_TYPE             DHT22
#define VENTOINHA_PIN        26
#define BUZZER_PIN           25
#define COMUNICADO_LED_PIN   27
const int DT_PINS[NUM_TIPOS]  = {34, 35, 36, 39, 32, 33, 13, 14};
const int SCK_PINS[NUM_TIPOS] = { 4, 16, 17, 18, 19, 21, 22, 23};

// ---------- Regras de negócio ----------
const float TEMPERATURA_LIMITE = 6.0;
const int   ESTOQUE_CRITICO    = 2;
const float KG_POR_BOLSA       = 0.450;
const float FATOR_CALIBRACAO   = 420.0;

DHT dht(DHT_PIN, DHT_TYPE);
HX711 balancas[NUM_TIPOS];
Servo ventoinha;

// ---------- Estado ----------
float pesoKg[NUM_TIPOS];
bool  pesoLido[NUM_TIPOS];
bool  refrigeracaoLigada = false;
bool  alertaEstoqueAtivo = false;

unsigned long ultimoCiclo = 0;
const unsigned long INTERVALO_CICLO = 2000;

// ---------- Envio HTTP ----------
void enviarAmbiente(float temperatura, float umidade) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Wokwi: não valida certificado

  HTTPClient http;
  String url = String(API_BASE_URL) + "/iot/ambiente";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-iot-key", IOT_KEY);

  String payload = "{\"device_id\":\"" + String(DEVICE_ID_AMBIENTE) +
                   "\",\"temperatura\":" + String(temperatura, 1) +
                   ",\"umidade\":" + String((int)umidade) + "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[Ambiente] HTTP %d\n", httpCode);
  } else {
    Serial.printf("[Ambiente] Erro: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void enviarBalanca(float pesoKg) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(API_BASE_URL) + "/iot/balanca";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-iot-key", IOT_KEY);

  String payload = "{\"device_id\":\"" + String(DEVICE_ID_BALANCA) +
                   "\",\"peso_kg\":" + String(pesoKg, 3) + "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[Balanca] HTTP %d\n", httpCode);
  } else {
    Serial.printf("[Balanca] Erro: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ---------- Servo (ventoinha) ----------
int anguloServo = 0;
int direcaoServo = 1;
unsigned long ultimoMovimentoServo = 0;
const unsigned long INTERVALO_SERVO = 20;
const int PASSO_SERVO = 10;

// ---------- Buzzer ----------
bool buzzerNivel = false;
unsigned long ultimoToggleBuzzerUs = 0;
const unsigned long MEIO_PERIODO_BUZZER_US = 500;
const unsigned long BIPE_MS = 400;

void atualizarBuzzer(unsigned long agoraMs) {
  bool tocando = alertaEstoqueAtivo && ((agoraMs / BIPE_MS) % 2 == 0);
  if (!tocando) {
    if (buzzerNivel) { digitalWrite(BUZZER_PIN, LOW); buzzerNivel = false; }
    return;
  }
  unsigned long agoraUs = micros();
  if (agoraUs - ultimoToggleBuzzerUs >= MEIO_PERIODO_BUZZER_US) {
    ultimoToggleBuzzerUs = agoraUs;
    buzzerNivel = !buzzerNivel;
    digitalWrite(BUZZER_PIN, buzzerNivel ? HIGH : LOW);
  }
}

void conectarWiFi() {
  Serial.print("Conectando ao WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(" conectado!");
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("--- INICIANDO O SISTEMA ---");
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(COMUNICADO_LED_PIN, OUTPUT);
  dht.begin();

  ventoinha.attach(VENTOINHA_PIN);
  ventoinha.write(0);

  for (int i = 0; i < NUM_TIPOS; i++) {
    balancas[i].begin(DT_PINS[i], SCK_PINS[i]);
    balancas[i].set_scale(FATOR_CALIBRACAO);
    pesoKg[i] = 0;
    pesoLido[i] = false;
  }

  conectarWiFi();
}

void loop() {
  unsigned long agora = millis();

  // --- Servo (ventoinha) ---
  if (refrigeracaoLigada) {
    if (agora - ultimoMovimentoServo >= INTERVALO_SERVO) {
      ultimoMovimentoServo = agora;
      anguloServo += direcaoServo * PASSO_SERVO;
      if (anguloServo >= 180) { anguloServo = 180; direcaoServo = -1; }
      if (anguloServo <= 0)   { anguloServo = 0;   direcaoServo = 1;  }
      ventoinha.write(anguloServo);
    }
  } else if (anguloServo != 0) {
    anguloServo = 0;
    ventoinha.write(0);
  }

  atualizarBuzzer(agora);

  // --- Balanças (leitura não bloqueante) ---
  static uint8_t idx = 0;
  if (balancas[idx].is_ready()) {
    float kg = balancas[idx].get_units(1);
    pesoKg[idx] = (kg < 0) ? 0 : kg;
    pesoLido[idx] = true;
  }
  idx = (idx + 1) % NUM_TIPOS;

  // --- Ciclo principal (a cada 2s) ---
  if (agora - ultimoCiclo < INTERVALO_CICLO) return;
  ultimoCiclo = agora;

  // Temperatura e umidade
  float t = dht.readTemperature();
  float u = dht.readHumidity();
  if (!isnan(t) && !isnan(u)) {
    float tArred = roundf(t * 2.0f) / 2.0f;
    enviarAmbiente(tArred, u);

    // Refrigeração automática
    bool deveRefrigerar = (t > TEMPERATURA_LIMITE);
    if (deveRefrigerar != refrigeracaoLigada) {
      refrigeracaoLigada = deveRefrigerar;
      Serial.println(refrigeracaoLigada
        ? ">> Refrigeracao LIGADA automaticamente"
        : ">> Refrigeracao DESLIGADA automaticamente");
    }
  } else {
    Serial.println("Falha ao ler o DHT22");
  }

  // Balança de O+ (índice 6)
  int idxOPlus = 6;
  if (pesoLido[idxOPlus]) {
    enviarBalanca(pesoKg[idxOPlus]);
  }

  // Alerta de estoque (local — o backend também gera o dele no banco)
  bool qualquerCritico = false;
  String resumo = "";
  for (int i = 0; i < NUM_TIPOS; i++) {
    if (!pesoLido[i]) { resumo += String(NOMES_TIPOS[i]) + ":? "; continue; }
    int bolsas = (int)lroundf(pesoKg[i] / KG_POR_BOLSA);
    if (bolsas < 0) bolsas = 0;
    if (bolsas > 99) bolsas = 99;
    if (bolsas <= ESTOQUE_CRITICO) qualquerCritico = true;
    resumo += String(NOMES_TIPOS[i]) + ":" + String(bolsas) + (bolsas <= ESTOQUE_CRITICO ? "! " : " ");
  }
  Serial.printf("Temp: %.1fC | Umid: %.0f%% | Estoque: %s\n", t, u, resumo.c_str());

  if (qualquerCritico != alertaEstoqueAtivo) {
    alertaEstoqueAtivo = qualquerCritico;
    Serial.println(alertaEstoqueAtivo
      ? ">> ALERTA: estoque CRITICO!"
      : ">> Estoque normalizado.");
  }
}
```

---

## 6. O que mudou em relação ao sketch original

| Item | Original (Blynk) | Adaptado (Nosso Sangue) |
|---|---|---|
| Transporte | MQTT (PubSubClient) | HTTP POST (HTTPClient) |
| Biblioteca | `PubSubClient.h` | `HTTPClient.h` + `WiFiClientSecure.h` |
| Autenticação | `device` + `BLYNK_AUTH_TOKEN` | Header `x-iot-key` |
| Endpoint | `blynk.cloud:1883` | `nosso-sangue-api.onrender.com/api/v1/iot/...` |
| Formato | Tópico MQTT + payload simples | JSON no corpo do POST |
| Envio de temperatura/umidade | `publish("ds/Temperatura", ...)` | `enviarAmbiente(t, u)` |
| Envio de estoque | 8 tópicos MQTT | 1 balança (`ESP32-BALANCA-O+`) |
| Refrigeração/estoque crítico | Tópicos MQTT | Alertas automáticos no backend (trigger) |
| Servo (ventoinha) | Mantido | **Mantido** (não envia ao backend) |
| Buzzer | Mantido | **Mantido** (não envia ao backend) |
| LED comunicado | Via MQTT downlink | Removido (não há acionamento remoto) |

---

## 7. Como testar

### 7.1. Monitor Serial do Wokwi

Você deve ver a cada 2s:

```
Temp: 3.5C | Umid: 60% | Estoque: A+:10 A-:10 B+:10 ...
[Ambiente] HTTP 201
[Balanca] HTTP 201
```

| Código | Significado |
|---|---|
| `HTTP 201` | Sucesso — leitura gravada |
| `HTTP 401` | `IOT_KEY` incorreta |
| `HTTP 404` | `device_id` não cadastrado no banco |
| `HTTP -1` ou `HTTP -11` | Backend dormindo (cold start do Render) |
| `HTTP -1` (após aquecer) | Sem conexão com internet |

### 7.2. Verificar no banco (Supabase Studio)

```sql
-- Últimas leituras de ambiente
select id, created_at, temperatura, umidade, alerta
from leituras_ambiente
order by created_at desc
limit 5;

-- Últimas leituras de balança
select id, created_at, peso_kg
from leituras_balanca
order by created_at desc
limit 5;

-- Alertas pendentes
select id, tipo, severidade, mensagem, created_at
from alertas
where resolvido = false
order by created_at desc;
```

### 7.3. Verificar no dashboard web

Abrir [https://nosso-sangue.vercel.app](https://nosso-sangue.vercel.app), fazer login como funcionário (`funcionario@test.local` / `senha123`) e acessar:

- **Câmara Fria:** deve mostrar as leituras mais recentes (temperatura, umidade)
- **Alertas:** se a temperatura sair de 2–6 °C, o backend gera um alerta automaticamente

### 7.4. Teste manual via curl (opcional)

Para confirmar que o backend está respondendo **antes** de abrir o Wokwi:

```bash
curl -X POST https://nosso-sangue-api.onrender.com/api/v1/iot/ambiente \
  -H "Content-Type: application/json" \
  -H "x-iot-key: SUA_IOT_KEY_AQUI" \
  -d '{"device_id":"ESP32-DHT22-001","temperatura":4.5,"umidade":65}'
```

Esperado: `{"ok":true,"leitura_id":...}`.

---

## 8. Troubleshooting

| Sintoma | Causa | Solução |
|---|---|---|
| `HTTP -1` na primeira requisição | Render dormindo | Aquecer com `curl .../health` antes |
| `HTTP 401` | `IOT_KEY` errada | Recopiar do painel do Render |
| `HTTP 404` | `device_id` inválido | Conferir `ESP32-DHT22-001` e `ESP32-BALANCA-O+` |
| `SSL error` ou `connection failed` | `WiFiClientSecure` sem `setInsecure` | Já incluído no sketch — verificar |
| WiFi não conecta | Rede errada no Wokwi | `WIFI_SSID` deve ser `"Wokwi-GUEST"` e senha vazia |
| Servo não se move | Temperatura abaixo de 6 °C | Comportamento esperado — aumentar a temperatura no DHT22 do Wokwi |
| Buzzer não toca | Estoque acima de 2 bolsas | Comportamento esperado — colocar peso nas balanças |

---

## 9. Limitações

- **Apenas a balança de O+** é enviada ao backend. As outras 7 (A+, A-, B+, B-, AB+, AB-) **funcionam localmente no sketch** (movimentam o buzzer e o resumo no Serial), mas não geram leitura no banco. Se quiser enviar todas, cadastre os 8 `device_id` no banco e adapte o `loop()` para chamar `enviarBalanca` 8 vezes.
- **Comunicado remoto removido.** No Blynk havia um downlink MQTT que acendia um LED. Como o backend não implementa esse canal, o LED fica sempre apagado. Se for necessário na demo, acionar manualmente no código.
- **Cold start do Render.** A primeira requisição após 15 min de inatividade pode levar 30 s. Aquecer antes.

---

## 10. Checklist final antes da demo

- [ ] `IOT_KEY` copiada do Render (não commitada)
- [ ] Backend aquecido (`curl .../health` retornando rápido)
- [ ] Wokwi rodando com o sketch adaptado
- [ ] Monitor Serial mostra `HTTP 201` a cada 2 s
- [ ] Supabase Studio confirma leituras novas em `leituras_ambiente` e `leituras_balanca`
- [ ] Dashboard web (`nosso-sangue.vercel.app`) mostra as leituras em **Câmara Fria**
- [ ] Temperatura elevada no Wokwi (>6 °C) gera alerta automático em **Alertas**

---