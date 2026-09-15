// ============================================================
// FACEF - Controle de Acesso por RFID
// Firmware ESP32 - Versao com Sensor de Carro e Timer
// ============================================================
// Placa: ESP32 DevKit V1
// Leitor: RFID UHF (JR1080 ou similar)
// Sensor: Presenca/Ultrassonico no pin 34
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>
#include "config.h"

// ============================================================
// Inicializacao dos componentes
// ============================================================

// Display OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, &SCREEN_HEIGHT, &Wire, -1);

// Serial para RFID
SoftwareSerial rfidSerial(RFID_RX_PIN, RFID_TX_PIN);

// Controle da cancela
bool cancelaAberta = false;
bool modoDefinitivo = false;
unsigned long tempoAbertura = 0;
unsigned long ultimoHeartbeat = 0;
unsigned long ultimaLeitura = 0;
unsigned long ultimoSensorCarro = 0;

// Timer local
int tempoRestante = 0;
bool timerAtivo = false;

// Sensor de carro
bool sensorCarroDetectado = false;
bool ultimoEstadoSensor = false;

// Buffer para tag lida
char bufferTag[TAMANHO_BUFFER_TAG];
int indiceBuffer = 0;

// ============================================================
// Funcoes auxiliares
// ============================================================

void conectarWiFi() {
  Serial.print("Conectando ao Wi-Fi");
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("FACEF - Controle de Acesso");
  display.setCursor(0, 20);
  display.println("Conectando ao Wi-Fi...");
  display.display();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 30) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    mostrarMensagem("CONECTADO", WiFi.localIP().toString().c_str());
    delay(2000);
  } else {
    Serial.println("\nFalha ao conectar no Wi-Fi");
    mostrarMensagem("ERRO", "Sem Wi-Fi");
    delay(3000);
  }
}

void mostrarMensagem(const char* linha1, const char* linha2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println(linha1);
  display.setTextSize(2);
  display.setCursor(0, 20);
  display.println(linha2);
  display.display();
}

void mostrarStatus() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  
  // Titulo
  display.setCursor(0, 0);
  display.println("FACEF - RFID");
  
  // Status da cancela
  display.setCursor(0, 14);
  display.print("Cancela: ");
  if (modoDefinitivo) {
    display.println("DEFINITIVO");
  } else {
    display.println(cancelaAberta ? "ABERTA" : "FECHADA");
  }
  
  // Timer
  if (timerAtivo && !modoDefinitivo) {
    display.setCursor(0, 26);
    display.print("Timer: ");
    display.print(tempoRestante);
    display.println("s");
  }
  
  // Sensor
  display.setCursor(0, 38);
  display.print("Sensor: ");
  display.println(sensorCarroDetectado ? "CARRO" : "Livre");
  
  // Wi-Fi
  display.setCursor(0, 50);
  display.print("Wi-Fi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "OK" : "ERRO");
  
  display.display();
}

// ============================================================
// Controle da cancela
// ============================================================

void iniciarTimerLocal() {
  tempoAbertura = millis();
  tempoRestante = TEMPORIZADOR_SEGUNDOS;
  timerAtivo = true;
  Serial.println("Timer iniciado: " + String(TEMPORIZADOR_SEGUNDOS) + "s");
}

void pararTimerLocal() {
  timerAtivo = false;
  tempoRestante = 0;
}

void resetarTimerLocal() {
  if (cancelaAberta && !modoDefinitivo) {
    tempoAbertura = millis();
    tempoRestante = TEMPORIZADOR_SEGUNDOS;
    Serial.println("Timer resetado - Sensor de carro");
  }
}

void abrirCancela() {
  digitalWrite(PINO_RELAY_CANCELA, HIGH);
  digitalWrite(PINO_LED_VERDE, HIGH);
  digitalWrite(PINO_BUZZER, HIGH);
  cancelaAberta = true;
  
  if (!modoDefinitivo) {
    iniciarTimerLocal();
  }
  
  Serial.println(">> Cancela ABERTA");
  mostrarMensagem("ACESSO", "LIBERADO");
  
  delay(500);
  digitalWrite(PINO_BUZZER, LOW);
}

void fecharCancela() {
  digitalWrite(PINO_RELAY_CANCELA, LOW);
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
  cancelaAberta = false;
  pararTimerLocal();
  
  Serial.println(">> Cancela FECHADA");
}

void acessoNegado() {
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  digitalWrite(PINO_BUZZER, HIGH);
  
  Serial.println(">> Acesso NEGADO");
  mostrarMensagem("ACESSO", "NEGADO");
  
  delay(2000);
  digitalWrite(PINO_BUZZER, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

// ============================================================
// Comunicacao com o servidor
// ============================================================

bool verificarTagServidor(String tag) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado");
    return false;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/gate/verificar-e-abrir";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);
  
  String json = "{\"tag_codigo\":\"" + tag + "\",\"dispositivo\":\"ESP32-01\"}";
  
  int httpCode = http.POST(json);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Resposta: " + response);
    
    bool autorizado = response.indexOf("\"autorizado\":true") >= 0;
    
    // Verificar modo definitivo
    if (response.indexOf("\"modoDefinitivo\":true") >= 0) {
      modoDefinitivo = true;
      Serial.println("Modo definitivo ativo no servidor");
    } else {
      modoDefinitivo = false;
    }
    
    http.end();
    return autorizado;
  } else {
    Serial.println("Erro HTTP: " + String(httpCode));
    http.end();
    return false;
  }
}

void notificarSensorCarro() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/gate/sensor-carro";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);
  
  String json = "{\"dispositivo\":\"ESP32-01\"}";
  http.POST(json);
  http.end();
}

void enviarHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  // Heartbeat periodico (pode ser implementado futuramente)
}

// ============================================================
// Leitura do sensor de carro
// ============================================================

void verificarSensorCarro() {
  // Leitura analogica do sensor (ultrassonico ou IR)
  // Valor baixo = carro detectado (varia conforme o sensor)
  bool estadoAtual = digitalRead(PINO_SENSOR_CARRO) == LOW;
  
  if (estadoAtual && !ultimoEstadoSensor) {
    // Carro detectado (borda de subida)
    sensorCarroDetectado = true;
    ultimoSensorCarro = millis();
    
    Serial.println(">> Sensor: CARRO DETECTADO");
    
    // Notificar servidor e resetar timer
    notificarSensorCarro();
    resetarTimerLocal();
  }
  
  // Desativar flag apos 2 segundos
  if (sensorCarroDetectado && (millis() - ultimoSensorCarro >= 2000)) {
    sensorCarroDetectado = false;
  }
  
  ultimoEstadoSensor = estadoAtual;
}

// ============================================================
// Leitura RFID
// ============================================================

String lerRFID() {
  String tag = "";
  
  while (rfidSerial.available()) {
    char c = rfidSerial.read();
    
    if (c == '\n' || c == '\r') {
      if (indiceBuffer > 0) {
        bufferTag[indiceBuffer] = '\0';
        tag = String(bufferTag);
        indiceBuffer = 0;
        break;
      }
    } else {
      if (indiceBuffer < TAMANHO_BUFFER_TAG - 1) {
        bufferTag[indiceBuffer++] = c;
      }
    }
  }
  
  return tag;
}

// ============================================================
// Setup principal
// ============================================================

void setup() {
  // Iniciar serial
  Serial.begin(BAUD_RATE_SERIAL);
  rfidSerial.begin(9600);
  
  Serial.println("\n=================================");
  Serial.println("FACEF - Sistema de Controle de Acesso");
  Serial.println("Versao 2.0.0 - Com Sensor e Timer");
  Serial.println("=================================\n");
  
  // Configurar pinos
  pinMode(PINO_RELAY_CANCELA, OUTPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);
  pinMode(PINO_SENSOR_CARRO, INPUT_PULLUP);
  
  // Garantir cancela fechada
  digitalWrite(PINO_RELAY_CANCELA, LOW);
  digitalWrite(PINO_BUZZER, LOW);
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
  
  // Iniciar display
  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("Erro ao iniciar display OLED");
    while (true);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("FACEF - Controle de Acesso");
  display.setCursor(0, 20);
  display.println("Versao 2.0.0");
  display.setCursor(0, 35);
  display.println("Iniciando...");
  display.display();
  
  delay(1000);
  
  // Conectar Wi-Fi
  conectarWiFi();
  
  // Sinal sonoro de inicializacao
  digitalWrite(PINO_BUZZER, HIGH);
  delay(200);
  digitalWrite(PINO_BUZZER, LOW);
  
  Serial.println("Sistema pronto!");
  Serial.println("Sensor de carro: GPIO " + String(PINO_SENSOR_CARRO));
  Serial.println("Timer: " + String(TEMPORIZADOR_SEGUNDOS) + " segundos");
  Serial.println("Aguardando tags RFID...\n");
}

// ============================================================
// Loop principal
// ============================================================

void loop() {
  // Verificar sensor de carro
  verificarSensorCarro();
  
  // Verificar se cancela precisa fechar (timer local)
  if (cancelaAberta && !modoDefinitivo && timerAtivo) {
    unsigned long elapsed = (millis() - tempoAbertura) / 1000;
    tempoRestante = max(0, TEMPORIZADOR_SEGUNDOS - (int)elapsed);
    
    if (tempoRestante <= 0) {
      Serial.println(">> Timer expirado - Fechando cancela");
      fecharCancela();
    }
  }
  
  // Heartbeat periodico
  if (millis() - ultimoHeartbeat >= INTERVALO_HEARTBEAT) {
    enviarHeartbeat();
    ultimoHeartbeat = millis();
    mostrarStatus();
  }
  
  // Verificar reconexao Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Tentando reconectar Wi-Fi...");
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  // Leitura RFID (com debounce)
  if (millis() - ultimaLeitura >= TEMPO_ENTRE_LEITURAS) {
    String tag = lerRFID();
    
    if (tag.length() > 0) {
      Serial.println("Tag detectada: " + tag);
      
      // Verificar no servidor
      bool autorizado = verificarTagServidor(tag);
      
      if (autorizado) {
        abrirCancela();
      } else {
        acessoNegado();
      }
      
      ultimaLeitura = millis();
    }
  }
  
  delay(10);
}
