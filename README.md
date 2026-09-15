# 🚗 UNIFACEF - Sistema de Controle de Acesso por RFID

Sistema completo para controle de acesso veicular utilizando tags RFID UHF, desenvolvido para o estacionamento da UNIFACEF.

## 📋 Visao Geral

O sistema resolve o problema de acesso nao autorizado ao estacionamento docente, controlando a cancela automaticamente atraves de leitura RFID.

### Funcionalidades

- **Leitura automatica de tags RFID** - Carros autorizados abrem a cancela automaticamente
- **Dashboard web** - Painel de gerenciamento em tempo real
- **Cadastro de tags** - Gerencie veiculos autorizados
- **Historico de acessos** - Registros completos de entradas e saidas
- **Controle manual** - Abertura/fechamento remoto da cancela
- **Alertas e notificacoes** - Avisos de acessos negados
- **Multi-dispositivo** - Varios ESP32s conectados

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  Dashboard │ Tags │ Logs │ Controle │ Dispositivos          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                          │
│  Express │ SQLite │ JWT Auth │ REST API                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  HARDWARE (ESP32)                            │
│  RFID UHF │ Relay │ LEDs │ Display OLED │ Buzzer           │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Banco | SQLite |
| Hardware | ESP32 + RFID UHF |
| Auth | JWT (JSON Web Tokens) |

## 📦 Estrutura do Projeto

```
facef-rfid-access/
├── backend/
│   ├── database.js          # Configuracao do SQLite
│   ├── server.js            # Servidor Express
│   ├── routes/
│   │   ├── auth.js          # Autenticacao
│   │   ├── tags.js          # CRUD de tags
│   │   ├── logs.js          # Historico
│   │   ├── gate.js          # Controle da cancela
│   │   └── dispositivos.js  # Gerenciamento ESP32
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tags.jsx
│   │   │   ├── Logs.jsx
│   │   │   ├── ControleCancela.jsx
│   │   │   └── Dispositivos.jsx
│   │   ├── api/api.js
│   │   └── App.jsx
│   └── package.json
├── esp32/
│   ├── rfid_access.ino      # Firmware principal
│   └── config.h             # Configuracoes
└── README.md
```

## 🚀 Instalacao

### Pre-requisitos

- Node.js 18+
- npm ou yarn
- Arduino IDE (para ESP32)
- Leitor RFID UHF (JR1080 ou similar)
- ESP32 DevKit V1

### Backend

```bash
# Navegar ate a pasta backend
cd backend

# Instalar dependencias
npm install

# Copiar arquivo de configuracao
cp .env.example .env

# Editar .env com suas configuracoes
# - PORT: porta do servidor (padrao 3001)
# - JWT_SECRET: chave secreta para tokens
# - DEVICE_API_KEY: chave para autenticar ESP32

# Iniciar servidor
npm start
```

### Frontend

```bash
# Navegar ate a pasta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### ESP32

1. Abrir Arduino IDE
2. Instalar suporte a ESP32
3. Instalar bibliotecas:
   - Adafruit SSD1306
   - Adafruit GFX Library
   - SoftwareSerial (ja vem com ESP32)
4. Abrir `esp32/rfid_access.ino`
5. Editar `config.h` com:
   - Credenciais Wi-Fi
   - URL do servidor
   - API Key gerada no painel
6. Selecionar placa: ESP32 Dev Module
7. Fazer upload

## ⚙️ Configuracao

### Variaveis de Ambiente (Backend)

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| PORT | Porta do servidor | 3001 |
| NODE_ENV | Ambiente | development |
| JWT_SECRET | Chave JWT | (obrigatorio) |
| DB_PATH | Caminho do banco | ./database.sqlite |
| CORS_ORIGIN | Origem permitida | http://localhost:5173 |
| DEVICE_API_KEY | Chave dos dispositivos | (obrigatorio) |

### Credenciais Padrao

- **Email:** admin@facef.edu.br
- **Senha:** admin123

> ⚠️ Altere a senha apos o primeiro login!

## 📱 Uso

### Acessar o Painel

1. Acesse `http://localhost:5173`
2. Faca login com as credenciais acima

### Cadastrar Tag

1. Va em "Tags RFID"
2. Clique em "Nova Tag"
3. Preencha os dados:
   - Codigo da tag (fornecido pelo leitor)
   - Proprietario
   - Veiculo
   - Placa
   - Departamento

### Controle da Cancela

1. Va em "Controle Cancela"
2. Use os botoes para abrir/fechar manualmente
3. O status eh atualizado automaticamente

### Monitorar Acessos

1. Va em "Historico"
2. Use os filtros para buscar
3. Exporte para CSV se necessário

## 🔧 Hardware

### Lista de Componentes

| Componente | Modelo | Quantidade | Preco Est. |
|------------|--------|------------|------------|
| Microcontrolador | ESP32 DevKit V1 | 1 | R$70 |
| Leitor RFID UHF | JR1080 | 1 | R$450 |
| Modulo Rele | 5V 2 canais | 1 | R$30 |
| Fonte | 12V 2A | 1 | R$50 |
| Etiquetas RFID | UHF (pack 10) | 1 | R$200 |
| Display OLED | 0.96" I2C | 1 | R$25 |
| Gabinete | IP65 | 1 | R$60 |
| Cabeamento | Varios | 1 | R$100 |
| **TOTAL** | | | **~R$985** |

### Diagrama de Conexao

```
ESP32
├── GPIO 25 ────── Rele (Cancela)
├── GPIO 26 ────── Buzzer
├── GPIO 27 ────── LED Verde
├── GPIO 14 ────── LED Vermelho
├── GPIO 16 (RX2) ─── RFID UHF TX
├── GPIO 17 (TX2) ─── RFID UHF RX
├── GPIO 21 (SDA) ─── Display OLED
└── GPIO 22 (SCL) ─── Display OLED
```

## 📊 API

### Endpoints Principais

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/tags | Listar tags |
| POST | /api/tags | Cadastrar tag |
| PUT | /api/tags/:id | Atualizar tag |
| DELETE | /api/tags/:id | Desativar tag |
| GET | /api/logs | Listar logs |
| POST | /api/gate/abrir | Abrir cancela |
| POST | /api/gate/fechar | Fechar cancela |
| GET | /api/gate/status | Status cancela |
| POST | /api/gate/verificar-e-abrir | Verificar tag (ESP32) |

## 🔐 Seguranca

- Autenticacao JWT para o painel web
- API Key para dispositivos ESP32
- Senhas hash com bcrypt
- CORS configurado
- Logs de auditoria

## 🐛 Troubleshooting

### ESP32 nao conecta no Wi-Fi
- Verifique credenciais no `config.h`
- Certifique-se que o sinal esta forte
- Reinicie o ESP32

### Tag nao eh lida
- Verifique se o leitor RFID esta conectado
- Confirme que a tag esta no formato correto
- Teste com o monitor serial

### Cancela nao abre
- Verifique a conexao do rele
- Teste o rele manualmente
- Confirme a API Key no backend

## 📈 Proximos Passos

- [ ] Integracao com camera para fotos
- [ ] App mobile para administradores
- [ ] Relatorios de uso do estacionamento
- [ ] Sistema de reserva de vagas
- [ ] Notificacoes por email/WhatsApp
- [ ] Integracao com sistema academico

## 👥 Equipe

Desenvolvido para a UNIFACEF - Faculdade de Churchill

## 📄 Licenca

Este projeto esta sob a licenca MIT. Veja o arquivo LICENSE para mais detalhes.
