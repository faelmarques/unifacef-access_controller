#!/usr/bin/env node

// Script de inicio para PM2
// Configura o ambiente e inicia o servidor

process.env.NODE_ENV = 'production';
process.env.PORT = '3001';

// Iniciar servidor (dotenv sera carregado pelo proprio server.js)
require('./server.js');
