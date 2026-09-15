const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('./middleware');

// Status da cancela
let statusCancela = {
  aberta: false,
  ultimaOperacao: null,
  motivo: null
};

// Abrir cancela manualmente (pelo dashboard)
router.post('/abrir', autenticar, (req, res) => {
  const { motivo } = req.body;

  statusCancela = {
    aberta: true,
    ultimaOperacao: new Date().toISOString(),
    motivo: motivo || 'Manual'
  };

  // Registrar log
  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    ['MANUAL', 'ENTRADA', 'DASHBOARD', `Abertura manual: ${motivo || 'Sem motivo'}`]
  );

  console.log(`Cancela ABERTA - Motivo: ${motivo || 'Manual'}`);

  res.json({
    status: 'aberta',
    mensagem: 'Cancela aberta com sucesso'
  });
});

// Fechar cancela
router.post('/fechar', autenticar, (req, res) => {
  statusCancela = {
    aberta: false,
    ultimaOperacao: new Date().toISOString(),
    motivo: 'Fechamento manual'
  };

  // Registrar log
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

// Controle via ESP32 - verificar tag e abrir se autorizado
router.post('/verificar-e-abrir', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { tag_codigo, dispositivo } = req.body;

  // Validar API key
  if (apiKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ erro: 'API key invalida' });
  }

  if (!tag_codigo) {
    return res.status(400).json({ erro: 'Tag nao fornecida' });
  }

  // Verificar se tag esta autorizada
  db.get('SELECT * FROM tags WHERE codigo = ? AND ativo = 1', [tag_codigo], (err, tag) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao verificar tag' });
    }

    const autorizado = !!tag;

    // Registrar tentativa
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
      statusCancela = {
        aberta: true,
        ultimaOperacao: new Date().toISOString(),
        motivo: `RFID: ${tag.proprietario}`
      };

      console.log(`Cancela ABERTA via RFID - Tag: ${tag_codigo} - ${tag.proprietario}`);
    } else {
      console.log(`Acesso NEGADO - Tag: ${tag_codigo}`);
    }

    res.json({
      autorizado,
      abrir_cancela: autorizado,
      proprietario: tag?.proprietario || null,
      veiculo: tag?.veiculo || null,
      placa: tag?.placa || null
    });
  });
});

module.exports = router;
