// ============================================================
// FACEF - Controle de Acesso por RFID
// Configuracao do Firmware ESP32
// ============================================================

#ifndef CONFIG_H
#define CONFIG_H

// --- Wi-Fi ---
#define WIFI_SSID "SUA_REDE_WIFI"
#define WIFI_PASSWORD "SUA_SENHA_WIFI"

// --- Servidor Backend ---
#define SERVER_URL "http://SEU_SERVIDOR:3001"
#define DEVICE_API_KEY "SUA_API_KEY_AQUI"

// --- Pinos do ESP32 ---
#define PINO_RELAY_CANCELA 25     // Pino que controla a cancela
#define PINO_BUZZER 26            // Buzzer para feedback sonoro
#define PINO_LED_VERDE 27         // LED verde (acesso liberado)
#define PINO_LED_VERMELHO 14      // LED vermelho (acesso negado)
#define PINO_SENSOR_CARRO 34      // Sensor de presenca/ultrassonico (entrada)

// --- RFID UHF (pins para serial) ---
#define RFID_RX_PIN 16            // RX2 do ESP32
#define RFID_TX_PIN 17            // TX2 do ESP32

// --- Display OLED ---
#define OLED_SDA 21
#define OLED_SCL 22
#define OLED_ADDR 0x3C

// --- Temporizacao ---
#define TEMPO_ABERTURA_CANCELA 10000  // 10 segundos (padrao)
#define TEMPO_ENTRE_LEITURAS 500      // 500ms entre leituras
#define INTERVALO_HEARTBEAT 30000     // 30 segundos

// --- Configuracoes gerais ---
#define BAUD_RATE_SERIAL 115200
#define TAMANHO_BUFFER_TAG 32

#endif
