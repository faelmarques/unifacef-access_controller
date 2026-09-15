const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('./middleware');

// === ESTADO DA CANCELA ===
let statusCancela = {
  aberta: false,
  ultimaOperacao: null,
  motivo: null,
  modoDefinitivo: false,
  timerAtivo: false,
  tempoRestante: 0,
  sensorCarro: false
};

// Configuracoes do timer
const TEMPORIZADOR_SEGUNDOS = 10;
let timerCancela = null;
let tempoInicioTimer = null;

// PIN da portaria (para operacao sem login)
const PIN_PORTARIA = '1234';

// === FUNCOES AUXILIARES ===

function iniciarTimer() {
  // Limpar timer anterior se existir
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
      // Tempo esgotado - fechar cancela
      clearInterval(timerCancela);
      timerCancela = null;
      statusCancela.timerAtivo = false;

      // So fechar se nao estiver no modo definitivo
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

// === ROTAS DO DASHBOARD (com autenticacao) ===

// Abrir cancela manualmente (pelo dashboard)
router.post('/abrir', autenticar, (req, res) => {
  const { motivo } = req.body;

  statusCancela.aberta = true;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = motivo || 'Manual';
  statusCancela.modoDefinitivo = false;

  // Iniciar timer
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

// === ROTAS PUBLICAS PARA A PORTARIA (sem login, com PIN) ===

// Verificar PIN da portaria
router.post('/portaria/verificar-pin', (req, res) => {
  const { pin } = req.body;

  if (pin === PIN_PORTARIA) {
    res.json({ valido: true });
  } else {
    res.status(401).json({ valido: false, erro: 'PIN invalido' });
  }
});

// Status da cancela (publico para portaria)
router.get('/portaria/status', (req, res) => {
  res.json(statusCancela);
});

// Abrir cancela (portaria)
router.post('/portaria/abrir', (req, res) => {
  const { pin, motivo } = req.body;

  if (pin !== PIN_PORTARIA) {
    return res.status(401).json({ erro: 'PIN invalido' });
  }

  statusCancela.aberta = true;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = motivo || 'Portaria';
  statusCancela.modoDefinitivo = false;

  // Iniciar timer
  iniciarTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'ENTRADA', 'PORTARIA', `Abertura manual: ${motivo || 'Portaria'}`]
  );

  console.log(`Cancela ABERTA pela Portaria`);

  res.json({
    status: 'aberta',
    timerAtivo: true,
    tempoRestante: TEMPORIZADOR_SEGUNDOS
  });
});

// Fechar cancela (portaria)
router.post('/portaria/fechar', (req, res) => {
  const { pin } = req.body;

  if (pin !== PIN_PORTARIA) {
    return res.status(401).json({ erro: 'PIN invalido' });
  }

  statusCancela.aberta = false;
  statusCancela.ultimaOperacao = new Date().toISOString();
  statusCancela.motivo = 'Portaria';
  statusCancela.modoDefinitivo = false;

  pararTimer();

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'SAIDA', 'PORTARIA', 'Fechamento manual - Portaria']
  );

  console.log('Cancela FECHADA pela Portaria');

  res.json({ status: 'fechada' });
});

// === MODO ABERTURA DEFINITIVA ===

// Ativar modo definitivo (cancela fica aberta sem timer)
router.post('/portaria/definitivo', (req, res) => {
  const { pin, ativar } = req.body;

  if (pin !== PIN_PORTARIA) {
    return res.status(401).json({ erro: 'PIN invalido' });
  }

  statusCancela.modoDefinitivo = ativar;

  if (ativar) {
    // Ativar modo definitivo - cancela fica aberta
    statusCancela.aberta = true;
    statusCancela.motivo = 'Abertura Definitiva';
    statusCancela.ultimaOperacao = new Date().toISOString();
    pararTimer();

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
      ['MANUAL', 'ENTRADA', 'PORTARIA', 'Ativado modo Abertura Definitiva']
    );

    console.log('Modo ABERTURA DEFINITIVA ativado');
  } else {
    // Desativar modo definitivo
    statusCancela.motivo = null;
    statusCancela.ultimaOperacao = new Date().toISOString();

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
      ['MANUAL', 'SAIDA', 'PORTARIA', 'Desativado modo Abertura Definitiva']
    );

    console.log('Modo ABERTURA DEFINITIVA desativado');
  }

  res.json({
    modoDefinitivo: statusCancela.modoDefinitivo,
    aberta: statusCancela.aberta
  });
});

// === SENSOR DE CARRO ===

// Notificar que sensor detectou carro (reseta timer)
router.post('/portaria/sensor-carro', (req, res) => {
  const { pin } = req.body;

  if (pin !== PIN_PORTARIA) {
    return res.status(401).json({ erro: 'PIN invalido' });
  }

  statusCancela.sensorCarro = true;
  resetarTimer();

  // Desligar flag apos 2 segundos
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
      // Se modo definitivo estiver ativo, nao alterar nada
      if (!statusCancela.modoDefinitivo) {
        statusCancela.aberta = true;
        statusCancela.ultimaOperacao = new Date().toISOString();
        statusCancela.motivo = `RFID: ${tag.proprietario}`;

        // Iniciar timer
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

// Sensor de carro do ESP32 (reseta timer automaticamente)
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
