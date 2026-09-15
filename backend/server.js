require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rotas
const rotasAuth = require('./routes/auth');
const rotasTags = require('./routes/tags');
const rotasLogs = require('./routes/logs');
const rotasDispositivos = require('./routes/dispositivos');
const rotaControleCancela = require('./routes/gate');

app.use('/api/auth', rotasAuth);
app.use('/api/tags', rotasTags);
app.use('/api/logs', rotasLogs);
app.use('/api/dispositivos', rotasDispositivos);
app.use('/api/gate', rotaControleCancela);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir frontend em producao
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
