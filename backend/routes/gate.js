const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar, autenticarPortaria } = require('./middleware');

// === ESTADO DA CANCELA ===
let statusCancela = {
  aberta: false,
  ultimaOperacao: null,
  motivo: null,
  modoDefinitivo: false,
  timerAtivo: false,
  tempoRestante: 0,
  sensorCarro: false,
  operador: null
};

// Configuracoes do timer
const TEMPORIZADOR_SEGUNDOS = 10;
let timerCancela = null;
let tempoInicioTimer = null;

// === FUNCOES AUXILIARES ===

function iniciarTimer() {
  if (timerCancela) {
    clearInterval(timerCancela);
  }

  tempoInicioTimer = Date.now();
  statusCancela.timerAtivo = true;
  statusCancela.tempoRestante = TEMPORIZADOR_SEGUNDOS;

  console.log(`Timer iniciado: ${TEMPORIZADOR_SEGUNDOS}s`);

  timerCancela = setInterval(() => {
    const elapsed = Math.floor((Date.now() - tempoInicioTimer) / 1000);
    statusCancela.tempoRestante = Math.max(0, TEMPORIZADOR_SEGUNDOS - elapsed);

    if (statusCancela.tempoRestante <= 0) {
      clearInterval(timerCancela);
      timerCancela = null;
      statusCancela.timerAtivo = false;

      if (!statusCancela.modoDefinitivo && statusCancela.aberta) {
        statusCancela.aberta = false;
        statusCancela.motivo = 'Timer expirado';

        db.run(
          'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
          ['TIMER', 'SAIDA', 'SISTEMA', 'Fechamento automatico - Timer expirado']
        );

        console.log('Cancela FECHADA automaticamente - Timer expirado');
      }
    }
  }, 1000);
}

function pararTimer() {
  if (timerCancela) {
    clearInterval(timerCancela);
    timerCancela = null;
  }
  statusCancela.timerAtivo = false;
  statusCancela.tempoRestante = 0;
}

function resetarTimer() {
  if (statusCancela.aberta && !statusCancela.modoDefinitivo) {
    console.log('Timer resetado - Sensor de carro detectou veiculo');
    tempoInicioTimer = Date.now();
    statusCancela.tempoRestante = TEMPORIZADOR_SEGUNDOS;
  }
}

// === ROTAS DO DASHBOARD (com autenticacao admin) ===

// Abrir cancela manualmente (pelo dashboard)
router.post('/abrir', autenticar, (req, res) => {
  const { motivo } = req.body;

  statusCancela.aberta = true;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = motivo || 'Manual';
  statusCancela.modoDefinitivo = false;
  statusCancela.operador = req.usuario?.nome || 'Admin';

  iniciarTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'ENTRADA', 'DASHBOARD', `Abertura manual: ${motivo || 'Sem motivo'}`]
  );

  console.log(`Cancela ABERTA - Motivo: ${motivo || 'Manual'}`);

  res.json({
    status: 'aberta',
    timerAtivo: true,
    tempoRestante: TEMPORIZADOR_SEGUNDOS,
    mensagem: 'Cancela aberta com sucesso'
  });
});

// Fechar cancela
router.post('/fechar', autenticar, (req, res) => {
  statusCancela.aberta = false;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = 'Fechamento manual';
  statusCancela.modoDefinitivo = false;
  statusCancela.operador = req.usuario?.nome || 'Admin';

  pararTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'SAIDA', 'DASHBOARD', 'Fechamento manual']
  );

  console.log('Cancela FECHADA');

  res.json({
    status: 'fechada',
    mensagem: 'Cancela fechada com sucesso'
  });
});

// Status atual da cancela
router.get('/status', autenticar, (req, res) => {
  res.json(statusCancela);
});

// === ROTAS DA PORTARIA (com autenticacao de operador) ===

// Status da cancela (portaria autenticada)
router.get('/portaria/status', autenticarPortaria, (req, res) => {
  res.json(statusCancela);
});

// Abrir cancela (portaria)
router.post('/portaria/abrir', autenticarPortaria, (req, res) => {
  const { motivo } = req.body;

  statusCancela.aberta = true;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = motivo || 'Portaria';
  statusCancela.modoDefinitivo = false;
  statusCancela.operador = req.usuario?.nome || 'Operador';

  iniciarTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'ENTRADA', 'PORTARIA', `Abertura: ${motivo || 'Portaria'} - Op: ${req.usuario?.nome}`]
  );

  console.log(`Cancela ABERTA pela Portaria - Operador: ${req.usuario?.nome}`);

  res.json({
    status: 'aberta',
    timerAtivo: true,
    tempoRestante: TEMPORIZADOR_SEGUNDOS
  });
});

// Fechar cancela (portaria)
router.post('/portaria/fechar', autenticarPortaria, (req, res) => {
  statusCancela.aberta = false;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = 'Portaria';
  statusCancela.modoDefinitivo = false;
  statusCancela.operador = req.usuario?.nome || 'Operador';

  pararTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'SAIDA', 'PORTARIA', `Fechamento manual - Op: ${req.usuario?.nome}`]
  );

  console.log(`Cancela FECHADA pela Portaria - Operador: ${req.usuario?.nome}`);

  res.json({ status: 'fechada' });
});

// Modo definitivo (portaria)
router.post('/portaria/definitivo', autenticarPortaria, (req, res) => {
  const { ativar } = req.body;

  statusCancela.modoDefinitivo = ativar;

  if (ativar) {
    statusCancela.aberta = true;
    statusCancela.motivo = 'Abertura Definitiva';
    statusCancela.ultimaOperacao = new Date().toISOString();
    statusCancela.operador = req.usuario?.nome || 'Operador';
    pararTimer();

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
      ['MANUAL', 'ENTRADA', 'PORTARIA', `Ativado modo Definitivo - Op: ${req.usuario?.nome}`]
    );

    console.log(`Modo ABERTURA DEFINITIVA ativado - Operador: ${req.usuario?.nome}`);
  } else {
    statusCancela.motivo = null;
    statusCancela.ultimaOperacao = new Date().toISOString();
    statusCancela.operador = req.usuario?.nome || 'Operador';

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
      ['MANUAL', 'SAIDA', 'PORTARIA', `Desativado modo Definitivo - Op: ${req.usuario?.nome}`]
    );

    console.log(`Modo ABERTURA DEFINITIVA desativado - Operador: ${req.usuario?.nome}`);
  }

  res.json({
    modoDefinitivo: statusCancela.modoDefinitivo,
    aberta: statusCancela.aberta
  });
});

// Sensor de carro (portaria)
router.post('/portaria/sensor-carro', autenticarPortaria, (req, res) => {
  statusCancela.sensorCarro = true;
  resetarTimer();

  setTimeout(() => {
    statusCancela.sensorCarro = false;
  }, 2000);

  res.json({ ok: true });
});

// === CONTROLE VIA ESP32 ===

// Verificar tag e abrir se autorizado
router.post('/verificar-e-abrir', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { tag_codigo, dispositivo } = req.body;

  if (apiKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ erro: 'API key invalida' });
  }

  if (!tag_codigo) {
    return res.status(400).json({ erro: 'Tag nao fornecida' });
  }

  db.get('SELECT * FROM tags WHERE codigo = ? AND ativo = 1', [tag_codigo], (err, tag) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao verificar tag' });
    }

    const autorizado = !!tag;

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
      [
        tag_codigo,
        autorizado ? 'ENTRADA' : 'NEGADO',
        dispositivo || 'ESP32-01',
        autorizado ? `Acesso liberado - ${tag.proprietario}` : 'Tag nao autorizada'
      ]
    );

    if (autorizado) {
      if (!statusCancela.modoDefinitivo) {
        statusCancela.aberta = true;
        statusCancela.ultimaOperacao = new Date().toISOString();
        statusCancela.motivo = `RFID: ${tag.proprietario}`;
        statusCancela.operador = 'RFID';

        iniciarTimer();
      }

      console.log(`Cancela ABERTA via RFID - Tag: ${tag_codigo} - ${tag.proprietario}`);
    } else {
      console.log(`Acesso NEGADO - Tag: ${tag_codigo}`);
    }

    res.json({
      autorizado,
      abrir_cancela: autorizado,
      modoDefinitivo: statusCancela.modoDefinitivo,
      proprietario: tag?.proprietario || null,
      veiculo: tag?.veiculo || null,
      placa: tag?.placa || null
    });
  });
});

// Sensor de carro do ESP32
router.post('/sensor-carro', (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ erro: 'API key invalida' });
  }

  statusCancela.sensorCarro = true;
  resetarTimer();

  setTimeout(() => {
    statusCancela.sensorCarro = false;
  }, 2000);

  res.json({ ok: true });
});

module.exports = router;
