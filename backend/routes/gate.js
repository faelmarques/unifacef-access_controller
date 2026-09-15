const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar, autenticarPortaria } = require('./middleware');

// === ESTADO POR LOCAL ===
// Cada local tem seu proprio estado de cancela
const estadosLocais = {};

function obterEstado(localId = 1) {
  if (!estadosLocais[localId]) {
    estadosLocais[localId] = {
      localId,
      aberta: false,
      ultimaOperacao: null,
      motivo: null,
      modoDefinitivo: false,
      timerAtivo: false,
      tempoRestante: 0,
      sensorCarro: false,
      operador: null,
      nomeLocal: null
    };
  }
  return estadosLocais[localId];
}

// Configuracoes do timer
const TEMPORIZADOR_SEGUNDOS = 10;
const timersLocais = {};

// === FUNCOES AUXILIARES ===

function iniciarTimer(localId = 1) {
  const estado = obterEstado(localId);

  if (timersLocais[localId]) {
    clearInterval(timersLocais[localId]);
  }

  const tempoInicio = Date.now();
  estado.timerAtivo = true;
  estado.tempoRestante = TEMPORIZADOR_SEGUNDOS;

  console.log(`Timer iniciado para local ${localId}: ${TEMPORIZADOR_SEGUNDOS}s`);

  timersLocais[localId] = setInterval(() => {
    const elapsed = Math.floor((Date.now() - tempoInicio) / 1000);
    estado.tempoRestante = Math.max(0, TEMPORIZADOR_SEGUNDOS - elapsed);

    if (estado.tempoRestante <= 0) {
      clearInterval(timersLocais[localId]);
      timersLocais[localId] = null;
      estado.timerAtivo = false;

      if (!estado.modoDefinitivo && estado.aberta) {
        estado.aberta = false;
        estado.motivo = 'Fechamento Automatico';

        db.run(
          'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
          ['TIMER', 'FECHAMENTO_AUTOMATICO', 'SISTEMA', localId, 'Sistema', `Timer expirado - ${estado.nomeLocal || 'Local ' + localId}`]
        );

        console.log(`Cancela FECHADA automaticamente - Local ${localId} - Timer expirado`);
      }
    }
  }, 1000);
}

function pararTimer(localId = 1) {
  if (timersLocais[localId]) {
    clearInterval(timersLocais[localId]);
    timersLocais[localId] = null;
  }
  const estado = obterEstado(localId);
  estado.timerAtivo = false;
  estado.tempoRestante = 0;
}

function resetarTimer(localId = 1) {
  const estado = obterEstado(localId);
  if (estado.aberta && !estado.modoDefinitivo) {
    console.log(`Timer resetado - Local ${localId} - Sensor de carro`);
    // Reiniciar timer
    iniciarTimer(localId);
  }
}

// Buscar nome do local
function buscarNomeLocal(localId, callback) {
  if (!localId) return callback('N/A');
  db.get('SELECT nome FROM locais WHERE id = ?', [localId], (err, local) => {
    callback(local?.nome || `Local ${localId}`);
  });
}

// === ROTAS DO DASHBOARD (com autenticacao admin) ===

// Status de todos os locais
router.get('/status-geral', autenticar, (req, res) => {
  db.all('SELECT id, nome FROM locais WHERE ativo = 1', (err, locais) => {
    if (err) locais = [];
    const statusLocais = locais.map(l => obterEstado(l.id));
    res.json(statusLocais);
  });
});

// Abrir cancela manualmente (pelo dashboard)
router.post('/abrir', autenticar, (req, res) => {
  const { motivo, localId } = req.body;
  const local_id = localId || 1;
  const estado = obterEstado(local_id);

  estado.aberta = true;
  estado.ultimaOperacao = new Date().toISOString();
  estado.motivo = motivo || 'Manual';
  estado.modoDefinitivo = false;
  estado.operador = req.usuario?.nome || 'Admin';

  iniciarTimer(local_id);

  buscarNomeLocal(local_id, (nomeLocal) => {
    estado.nomeLocal = nomeLocal;

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      ['MANUAL', 'ABERTURA', 'DASHBOARD', local_id, estado.operador, `Abertura manual: ${motivo || 'Sem motivo'} - ${nomeLocal}`]
    );

    console.log(`Cancela ABERTA - Local: ${nomeLocal} - Motivo: ${motivo || 'Manual'}`);

    res.json({
      status: 'aberta',
      timerAtivo: true,
      tempoRestante: TEMPORIZADOR_SEGUNDOS,
      mensagem: 'Cancela aberta com sucesso'
    });
  });
});

// Fechar cancela
router.post('/fechar', autenticar, (req, res) => {
  const { localId } = req.body;
  const local_id = localId || 1;
  const estado = obterEstado(local_id);

  estado.aberta = false;
  estado.ultimaOperacao = new Date().toISOString();
  estado.motivo = 'Fechamento Manual';
  estado.modoDefinitivo = false;
  estado.operador = req.usuario?.nome || 'Admin';

  pararTimer(local_id);

  buscarNomeLocal(local_id, (nomeLocal) => {
    estado.nomeLocal = nomeLocal;

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      ['MANUAL', 'FECHAMENTO', 'DASHBOARD', local_id, estado.operador, `Fechamento manual - ${nomeLocal}`]
    );

    console.log(`Cancela FECHADA - Local: ${nomeLocal}`);

    res.json({
      status: 'fechada',
      mensagem: 'Cancela fechada com sucesso'
    });
  });
});

// Status de um local especifico
router.get('/status/:localId', autenticar, (req, res) => {
  const localId = parseInt(req.params.localId) || 1;
  res.json(obterEstado(localId));
});

// Status atual da cancela (compatibilidade)
router.get('/status', autenticar, (req, res) => {
  res.json(obterEstado(1));
});

// === ROTAS DA PORTARIA (com autenticacao de operador) ===

// Status da cancela (portaria autenticada)
router.get('/portaria/status', autenticarPortaria, (req, res) => {
  const localId = req.usuario?.local_id || 1;
  const estado = obterEstado(localId);
  res.json(estado);
});

// Abrir cancela (portaria)
router.post('/portaria/abrir', autenticarPortaria, (req, res) => {
  const { motivo } = req.body;
  const localId = req.usuario?.local_id || 1;
  const estado = obterEstado(localId);

  estado.aberta = true;
  estado.ultimaOperacao = new Date().toISOString();
  estado.motivo = motivo || 'Abertura Manual';
  estado.modoDefinitivo = false;
  estado.operador = req.usuario?.nome || 'Operador';

  iniciarTimer(localId);

  buscarNomeLocal(localId, (nomeLocal) => {
    estado.nomeLocal = nomeLocal;

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      ['MANUAL', 'ABERTURA', 'PORTARIA', localId, estado.operador, `Abertura manual - ${nomeLocal}`]
    );

    console.log(`Cancela ABERTA pela Portaria - Operador: ${estado.operador} - Local: ${nomeLocal}`);

    res.json({
      status: 'aberta',
      timerAtivo: true,
      tempoRestante: TEMPORIZADOR_SEGUNDOS
    });
  });
});

// Fechar cancela (portaria)
router.post('/portaria/fechar', autenticarPortaria, (req, res) => {
  const localId = req.usuario?.local_id || 1;
  const estado = obterEstado(localId);

  estado.aberta = false;
  estado.ultimaOperacao = new Date().toISOString();
  estado.motivo = 'Fechamento Manual';
  estado.modoDefinitivo = false;
  estado.operador = req.usuario?.nome || 'Operador';

  pararTimer(localId);

  buscarNomeLocal(localId, (nomeLocal) => {
    estado.nomeLocal = nomeLocal;

    db.run(
      'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      ['MANUAL', 'FECHAMENTO', 'PORTARIA', localId, estado.operador, `Fechamento manual - ${nomeLocal}`]
    );

    console.log(`Cancela FECHADA pela Portaria - Operador: ${estado.operador} - Local: ${nomeLocal}`);

    res.json({ status: 'fechada' });
  });
});

// Modo definitivo (portaria)
router.post('/portaria/definitivo', autenticarPortaria, (req, res) => {
  const { ativar } = req.body;
  const localId = req.usuario?.local_id || 1;
  const estado = obterEstado(localId);

  estado.modoDefinitivo = ativar;

  buscarNomeLocal(localId, (nomeLocal) => {
    estado.nomeLocal = nomeLocal;

    if (ativar) {
      estado.aberta = true;
      estado.motivo = 'Abertura Definitiva';
      estado.ultimaOperacao = new Date().toISOString();
      estado.operador = req.usuario?.nome || 'Operador';
      pararTimer(localId);

      db.run(
        'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
        ['MANUAL', 'ABERTURA_DEFINITIVA', 'PORTARIA', localId, estado.operador, `Ativado modo Definitivo - ${nomeLocal}`]
      );

      console.log(`Modo ABERTURA DEFINITIVA ativado - Operador: ${estado.operador} - Local: ${nomeLocal}`);
    } else {
      estado.motivo = null;
      estado.ultimaOperacao = new Date().toISOString();
      estado.operador = req.usuario?.nome || 'Operador';

      db.run(
        'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
        ['MANUAL', 'DESATIVAR_DEFINITIVO', 'PORTARIA', localId, estado.operador, `Desativado modo Definitivo - ${nomeLocal}`]
      );

      console.log(`Modo ABERTURA DEFINITIVA desativado - Operador: ${estado.operador} - Local: ${nomeLocal}`);
    }

    res.json({
      modoDefinitivo: estado.modoDefinitivo,
      aberta: estado.aberta
    });
  });
});

// Sensor de carro (portaria)
router.post('/portaria/sensor-carro', autenticarPortaria, (req, res) => {
  const localId = req.usuario?.local_id || 1;
  const estado = obterEstado(localId);

  estado.sensorCarro = true;
  resetarTimer(localId);

  setTimeout(() => {
    estado.sensorCarro = false;
  }, 2000);

  res.json({ ok: true });
});

// === CONTROLE VIA ESP32 ===

// Verificar tag e abrir se autorizado
router.post('/verificar-e-abrir', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { tag_codigo, dispositivo, localId } = req.body;
  const local_id = localId || 1;

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
    const estado = obterEstado(local_id);

    buscarNomeLocal(local_id, (nomeLocal) => {
      estado.nomeLocal = nomeLocal;

      db.run(
        'INSERT INTO logs (tag_codigo, tipo, dispositivo, local_id, operador, observacao) VALUES (?, ?, ?, ?, ?, ?)',
        [
          tag_codigo,
          autorizado ? 'ABERTURA_RFID' : 'ACESSO_NEGADO',
          dispositivo || 'ESP32-01',
          local_id,
          'RFID',
          autorizado ? `Acesso liberado - ${tag.proprietario} - ${nomeLocal}` : `Acesso negado - Tag: ${tag_codigo} - ${nomeLocal}`
        ]
      );

      if (autorizado) {
        if (!estado.modoDefinitivo) {
          estado.aberta = true;
          estado.ultimaOperacao = new Date().toISOString();
          estado.motivo = `RFID: ${tag.proprietario}`;
          estado.operador = 'RFID';

          iniciarTimer(local_id);
        }

        console.log(`Cancela ABERTA via RFID - Tag: ${tag_codigo} - ${tag.proprietario} - Local: ${nomeLocal}`);
      } else {
        console.log(`Acesso NEGADO - Tag: ${tag_codigo} - Local: ${nomeLocal}`);
      }

      res.json({
        autorizado,
        abrir_cancela: autorizado,
        modoDefinitivo: estado.modoDefinitivo,
        proprietario: tag?.proprietario || null,
        veiculo: tag?.veiculo || null,
        placa: tag?.placa || null
      });
    });
  });
});

// Sensor de carro do ESP32
router.post('/sensor-carro', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { localId } = req.body;
  const local_id = localId || 1;

  if (apiKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ erro: 'API key invalida' });
  }

  const estado = obterEstado(local_id);
  estado.sensorCarro = true;
  resetarTimer(local_id);

  setTimeout(() => {
    estado.sensorCarro = false;
  }, 2000);

  res.json({ ok: true });
});

module.exports = router;
