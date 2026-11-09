# Integração IoT (Cirkit Designer) — Simulação ao Backend Nosso Sangue

**Última atualização:** 2026-11-08
**Responsável pelo backend:** Daniel Lemos
**Time de IoT:** Carolina Carneiro
**Simulação atual (Cirkit Designer):** https://app.cirkitdesigner.com/project/84d2f17c-1e9b-4c09-8d69-0a404e494d14

---

## 1. Objetivo

Conectar a simulação do microcontrolador ESP32-S3 no Cirkit Designer (DHT22 + 8 balanças HX711) ao backend em produção do projeto Nosso Sangue, enviando dados via chamadas HTTP diretas.

Nota de Migração: O projeto iniciou no simulador Wokwi, mas foi migrado para o Cirkit Designer devido a limitações severas do Wokwi com conexões TLS/HTTPS (erro Falha na conexão TLS), que impediam o envio de dados para o Render.

---

## 2. Arquitetura

```
┌─────────────────┐      HTTP POST (JSON)      ┌──────────────────────┐
│ Cirkit (ESP32-S3│ ─────────────────────────> │  Backend (Render)    │
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

-Cirkit Designer: Simula o hardware real (ESP32-S3) e conecta à internet através da rede virtual nativa CirkitWifi.

-Backend: API REST no Render valida o header x-iot-key, grava a leitura e dispara triggers.

-Banco: Supabase armazena leituras e gera alertas automáticos (temperatura fora da faixa 2–6 °C e estoque ≤ 5 bolsas).

---

## 3. Credenciais necessárias

> ⚠️ **Estas informações devem ser obtidas com o Daniel (backend). Nunca commitar `IOT_KEY` no repositório.**

| Variável | Descrição | Onde encontrar |
|---|---|---|
| `API_BASE_URL` | URL do backend em produção | `https://nosso-sangue-api.onrender.com/api/v1` |
| `IOT_KEY` | Chave de autenticação dos dispositivos IoT | Painel do Render → `nosso-sangue-api` → Environment → `IOT_KEY` |
| `DEVICE_ID_AMBIENTE` | Identificador do sensor de ambiente | `ESP32-DHT22-001` (fixo, já cadastrado no banco) |
| `DEVICE_ID_BALANCA` | Identificador da balança | `ESP32-BALANCA-O+` (fixo, já cadastrado no banco) |

**🚨 Aviso sobre Túneis (Ngrok/Cloudflare):** **Não utilize ferramentas de túnel** (Ngrok, Cloudflare Tunnel) para expor o Render. Os firewalls (WAF) dessas ferramentas bloqueiam conexões de simuladores IoT com erros 403 Forbidden ou connection refused. A comunicação deve ser feita diretamente para a URL do Render.

**Observação:** o backend no plano free do Render **hiberna após 15 min sem uso**. Antes de iniciar a simulação, "acorde" o backend:

```bash
curl https://nosso-sangue-api.onrender.com/api/v1/health
```

Se demorar mais de 10 segundos, é o cold start. Aguarde retornar `{"ok":true,...}` e siga.

---

## 4. Bibliotecas necessárias (Wokwi)

No Cirkit Designer, as bibliotecas são gerenciadas automaticamente durante a compilação. O código utiliza:

WiFi.h, HTTPClient.h, WiFiClientSecure.h (Nativas do ESP32)

DHT sensor library

ESP32Servo

HX711 Arduino Library

(Não é mais necessário adicionar bibliotecas ao libraries.txt manualmente, o Cirkit faz isso via #include no código).

---
## 5. Pinagem adaptada 

Como utilizamos a placa ESP32-S3 no Cirkit, os pinos do ESP32 clássico (como 34, 35, 36, 26) não existem ou têm funções diferentes. O código foi adaptado para a seguinte pinagem:

Componente	Pino no ESP32-S3	Observação
DHT22	15	Sensor de Temperatura e Umidade
Servo (Ventoinha)	21	Controle PWM
Buzzer (Piezo)	47	Alerta sonoro
LED (Comunicado)	48	Alerta visual
HX711 (8x)	DAT: 1, 2, 4, 5, 6, 7, 8, 9
CLK: 10, 11, 12, 13, 14, 16, 17, 18	Conectar em pares (A+ até O-)

---
## 6. Sketch adaptado (`sketch.ino`)

Substitua o arquivo do Cirkit por este. As principais mudanças incluem: adaptação de pinos, envio de todas as 8 balanças em sistema de rodízio, e remoção dos túneis.

cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <WiFiClientSecure.h>

// ---------- Wi-Fi (Rede simulada do Cirkit) ----------
const char* WIFI_SSID = "CirkitWifi";
const char* WIFI_PASS = "";

// ---------- Backend Nosso Sangue (Conexão Direta - Sem Túneis) ----------
const char* API_URL_AMBIENTE = "https://nosso-sangue-api.onrender.com/api/v1/iot/ambiente";
const char* API_URL_BALANCA  = "https://nosso-sangue-api.onrender.com/api/v1/iot/balanca";
const char* IOT_KEY = "COLE_AQUI_A_IOT_KEY_DO_RENDER";

const char* DEVICE_ID_AMBIENTE = "ESP32-DHT22-001";

// ---------- Tipos sanguíneos ----------
#define NUM_TIPOS 8
const char* NOMES_TIPOS[NUM_TIPOS] = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};

// ---------- Pinos (Adaptados para ESP32-S3 no Cirkit) ----------
#define DHT_PIN              15
#define DHT_TYPE             DHT22
#define VENTOINHA_PIN        21 
#define BUZZER_PIN           47 
#define COMUNICADO_LED_PIN   48 

// Mapeamento dos pinos das 8 balanças na ESP32-S3
const int DT_PINS[NUM_TIPOS]  = { 1,  2,  4,  5,  6,  7,  8,  9};
const int SCK_PINS[NUM_TIPOS] = {10, 11, 12, 13, 14, 16, 17, 18};

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
  client.setInsecure(); // Ignora validação de certificado (necessário para simulação)
  
  HTTPClient http;
  http.begin(client, API_URL_AMBIENTE); 
  http.setReuse(false); 
  http.setTimeout(15000); 

  http.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
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

void enviarBalanca(String deviceId, float pesoKg) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  
  HTTPClient http;
  http.begin(client, API_URL_BALANCA);
  http.setReuse(false);
  http.setTimeout(15000);

  http.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-iot-key", IOT_KEY);

  String payload = "{\"device_id\":\"" + deviceId +
                   "\",\"peso_kg\":" + String(pesoKg, 3) + "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[Balanca %s] HTTP %d\n", deviceId.c_str(), httpCode);
  } else {
    Serial.printf("[Balanca %s] Erro: %s\n", deviceId.c_str(), http.errorToString(httpCode).c_str());
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
    if (buzzerNivel) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerNivel = false;
    }
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
  Serial.print("Conectando ao WiFi (CirkitWifi)");
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" conectado!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" FALHOU! (Tempo esgotado)");
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000); 
  Serial.println("--- INICIANDO O SISTEMA ---"); 
  
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(COMUNICADO_LED_PIN, OUTPUT);
  dht.begin();

  ventoinha.attach(VENTOINHA_PIN);
  ventoinha.write(0);

  for (int i = 0; i < NUM_TIPOS; i++) {
    balancas[i].begin(DT_PINS[i], SCK_PINS[i]);
    balancas[i].set_scale(FATOR_CALIBRACAO);
    balancas[i].tare(); 
    pesoKg[i] = 0;
    pesoLido[i] = false;
  }

  Serial.println("Tentando conectar ao WiFi...");
  conectarWiFi();
  Serial.println("WiFi Conectado!");
}

void loop() {
  unsigned long agora = millis();

  // --- Servo (ventoinha) ---
  if (refrigeracaoLigada) {
    if (agora - ultimoMovimentoServo >= INTERVALO_SERVO) {
      ultimoMovimentoServo = agora;
      anguloServo += direcaoServo * PASSO_SERVO;
      if (anguloServo >= 180) {
        anguloServo = 180;
        direcaoServo = -1;
      }
      if (anguloServo <= 0)   {
        anguloServo = 0;
        direcaoServo = 1;
      }
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
    delay(5);
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

  // --- Rodízio de envio das balanças ---
  static uint8_t idxEnvioBalanca = 0;
  
  if (pesoLido[idxEnvioBalanca]) {
    String idBalanca = String("ESP32-BALANCA-") + String(NOMES_TIPOS[idxEnvioBalanca]);
    enviarBalanca(idBalanca, pesoKg[idxEnvioBalanca]);
  }
  
  idxEnvioBalanca = (idxEnvioBalanca + 1) % NUM_TIPOS;

  // Alerta de estoque (local)
  bool qualquerCritico = false;
  String resumo = "";
  for (int i = 0; i < NUM_TIPOS; i++) {
    if (!pesoLido[i]) {
      resumo += String(NOMES_TIPOS[i]) + ":? ";
      continue;
    }
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

---


## 7. Como testar

### 7.1. Monitor Serial do Cirkit

Você deve ver a cada 2s o envio intercalado de uma balança e do ambiente:

text
Temp: 3.5C | Umid: 60% | Estoque: A+:10 A-:10 B+:10 ...
[Ambiente] HTTP 201
[Balanca ESP32-BALANCA-A+] HTTP 201
[Balanca ESP32-BALANCA-A-] HTTP 201

**Código	Significado**

**HTTP 201	Sucesso** — leitura gravada no banco.
**HTTP 404	device_id** (ex: ESP32-BALANCA-B+) não cadastrado no Supabase.
**HTTP 403**	Você está usando um túnel (Ngrok/Cloudflare) no meio do caminho. Remova o túnel.
**HTTP -1**	Backend dormindo (cold start do Render) ou sem internet.

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
| `HTTP -1` na primeira requisição | Render dormindo (Cold Start) | Aquecer com `curl .../health` antes de rodar o Cirkit. |
| `HTTP 401` | `IOT_KEY` errada | Recopiar a chave do painel do Render e atualizar no código. |
| `HTTP 403` (Forbidden) | Uso de Ngrok ou Cloudflare Tunnel | Remover os túneis. O Cirkit deve apontar **diretamente** para o Render. |
| `HTTP 404` (nas balanças) | `device_id` não cadastrado no Supabase | Rodar o script SQL para cadastrar as 8 balanças (ex: `ESP32-BALANCA-A+`) na tabela `sensores`. |
| `SSL error` ou `connection failed` | `WiFiClientSecure` sem `setInsecure` ou simulação no Wokwi | Já incluído no sketch do Cirkit. Se estiver no Wokwi, migrar para o Cirkit Designer. |
| WiFi não conecta | Rede errada no código | `WIFI_SSID` deve ser `"CirkitWifi"` e a senha vazia (`""`). |
| Servo não se move | Temperatura abaixo de 6 °C | Comportamento esperado — aumentar a temperatura no DHT22 do Cirkit para acima de 6 °C. |
| Buzzer não toca | Estoque acima de 2 bolsas | Comportamento esperado — colocar peso (≤ 0,9 kg) em alguma balança para ativar o alerta crítico. |
| Dashboard não atualiza | Cache do Next.js (Vercel) | Adicionar `export const dynamic = 'force-dynamic';` no topo do arquivo da página ou recarregar com `Ctrl + F5`. |
| Balanças marcam 0 | Falta de calibração inicial | O código já faz o `tare()` no setup. Certifique-se de iniciar a simulação com o peso em 0 antes de alterar o slider. |

---