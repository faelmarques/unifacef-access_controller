const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { autenticar } = require('./middleware');

// Listar dispositivos
router.get('/', autenticar, (req, res) => {
  db.all('SELECT * FROM dispositivos ORDER BY criado_em DESC', (err, dispositivos) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar dispositivos' });
    }
    res.json(dispositivos);
  });
});

// Cadastrar novo dispositivo
router.post('/', autenticar, (req, res) => {
  const { nome, localizacao } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome do dispositivo e obrigatorio' });
  }

  const apiKey = uuidv4();

  db.run(
    'INSERT INTO dispositivos (nome, localizacao, api_key) VALUES (?, ?, ?)',
    [nome, localizacao || '', apiKey],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao cadastrar dispositivo' });
      }

      res.status(201).json({
        id: this.lastID,
        api_key: apiKey,
        mensagem: 'Dispositivo cadastrado com sucesso'
      });
    }
  );
});

// Atualizar status do dispositivo (heartbeat)
router.put('/:id/heartbeat', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE dispositivos SET online = 1, ultimo_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao atualizar heartbeat' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ erro: 'Dispositivo nao encontrado' });
      }

      res.json({ mensagem: 'Heartbeat registrado' });
    }
  );
});

// Deletar dispositivo
router.delete('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM dispositivos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao deletar dispositivo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Dispositivo nao encontrado' });
    }

    res.json({ mensagem: 'Dispositivo removido com sucesso' });
  });
});

module.exports = router;
