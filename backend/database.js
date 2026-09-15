const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado com sucesso');
    inicializarBanco();
  }
});

function inicializarBanco() {
  db.serialize(() => {
    // Tabela de usuarios (admin do sistema)
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de locais (estacionamentos, unidades, etc)
    db.run(`
      CREATE TABLE IF NOT EXISTS locais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        ativo INTEGER DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de tags RFID autorizadas
    db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        proprietario TEXT NOT NULL,
        veiculo TEXT,
        placa TEXT,
        departamento TEXT,
        local_id INTEGER,
        ativo INTEGER DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (local_id) REFERENCES locais(id)
      )
    `);

    // Tabela de logs de acesso
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_codigo TEXT,
        tipo TEXT NOT NULL,
        dispositivo TEXT,
        local_id INTEGER,
        operador TEXT,
        observacao TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (local_id) REFERENCES locais(id)
      )
    `);

    // Tabela de dispositivos (ESP32s conectados)
    db.run(`
      CREATE TABLE IF NOT EXISTS dispositivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        local_id INTEGER,
        tipo TEXT DEFAULT 'cancela',
        api_key TEXT UNIQUE NOT NULL,
        online INTEGER DEFAULT 0,
        ultimo_heartbeat DATETIME,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (local_id) REFERENCES locais(id)
      )
    `);

    // Tabela de usuarios da portaria
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios_portaria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        local_id INTEGER,
        ativo INTEGER DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (local_id) REFERENCES locais(id)
      )
    `);

    // Criar admin padrao se nao existir
    db.get('SELECT id FROM usuarios LIMIT 1', (err, row) => {
      if (!row) {
        const bcrypt = require('bcryptjs');
        const senhaHash = bcrypt.hashSync('admin123', 10);
        db.run(
          'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
          ['Administrador', 'admin@facef.edu.br', senhaHash]
        );
        console.log('Usuario admin criado: admin@facef.edu.br / admin123');
      }
    });
  });
}

module.exports = db;
