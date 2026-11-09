// NÃO COMMITAR IOT_KEY REAL. O repositório é público.
// Obter a chave com o Daniel (backend) e colar localmente antes de simular.
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <WiFiClientSecure.h>

// ---------- Wi-Fi (Rede simulada do Cirkit) ----------
const char* WIFI_SSID = "CirkitWifi";
const char* WIFI_PASS = "";

// ---------- Backend Nosso Sangue (via Cloudflare Tunnel) ----------
// Certifique-se de que o terminal do cloudflared ainda está aberto e rodando!
const char* API_URL_AMBIENTE = "https://nosso-sangue-api.onrender.com/api/v1/iot/ambiente";
const char* API_URL_BALANCA  = "https://nosso-sangue-api.onrender.com/api/v1/iot/balanca";
const char* IOT_KEY = "SUA_IOT_KEY_AQUI";  // obter com o Daniel, NÃO COMMITAR
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
const float KG_POR_BOLSA            = 0.640;  // 500ml sangue + 70ml anticoag + bolsa (~40g)
const int   MAX_BOLSAS_CACAMBA      = 7;      // 7 × 0,64 = 4,48 kg (< 5 kg da balança)
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

// ---------- Envio HTTP (Usando HTTPClient) ----------
void enviarAmbiente(float temperatura, float umidade) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Ignora validação de certificado (necessário para simulação)
  
  HTTPClient http;
  http.begin(client, API_URL_AMBIENTE); 
  http.setReuse(false); 
  http.setTimeout(15000); 

  // Cabeçalhos (User-Agent de navegador para evitar bloqueios de firewall)
  http.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-iot-key", IOT_KEY);
  http.addHeader("Host", "nosso-sangue-api.onrender.com");

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
  http.addHeader("Host", "nosso-sangue-api.onrender.com");

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
    int bolsasEnvio = (int)lroundf(pesoKg[idxEnvioBalanca] / KG_POR_BOLSA);
    if (bolsasEnvio < 0) bolsasEnvio = 0;
    if (bolsasEnvio > MAX_BOLSAS_CACAMBA) bolsasEnvio = MAX_BOLSAS_CACAMBA;

    String idBalanca = String("ESP32-BALANCA-") + String(NOMES_TIPOS[idxEnvioBalanca]);
    // Envia o peso RECALCULADO (bolsas × 0.640), nunca o bruto do HX711
    enviarBalanca(idBalanca, bolsasEnvio * KG_POR_BOLSA);
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
    if (bolsas > MAX_BOLSAS_CACAMBA) bolsas = MAX_BOLSAS_CACAMBA;
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