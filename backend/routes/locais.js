const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('./middleware');

// Listar todos os locais
router.get('/', autenticar, (req, res) => {
  db.all('SELECT * FROM locais ORDER BY nome', (err, locais) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar locais' });
    }
    res.json(locais);
  });
});

// Buscar local por ID com detalhes
router.get('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM locais WHERE id = ?', [id], (err, local) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar local' });
    }
    if (!local) {
      return res.status(404).json({ erro: 'Local nao encontrado' });
    }

    // Buscar dispositivos vinculados
    db.all('SELECT * FROM dispositivos WHERE local_id = ?', [id], (err, dispositivos) => {
      if (err) dispositivos = [];
      local.dispositivos = dispositivos;
      res.json(local);
    });
  });
});

// Cadastrar novo local
router.post('/', autenticar, (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome do local e obrigatorio' });
  }

  db.run(
    'INSERT INTO locais (nome, descricao) VALUES (?, ?)',
    [nome, descricao || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao cadastrar local' });
      }

      res.status(201).json({
        id: this.lastID,
        mensagem: 'Local cadastrado com sucesso'
      });
    }
  );
});

// Atualizar local
router.put('/:id', autenticar, (req, res) => {
  const { id } = req.params;
  const { nome, descricao, ativo } = req.body;

  db.run(
    'UPDATE locais SET nome = COALESCE(?, nome), descricao = COALESCE(?, descricao), ativo = COALESCE(?, ativo) WHERE id = ?',
    [nome, descricao, ativo, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao atualizar local' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: 'Local nao encontrado' });
      }
      res.json({ mensagem: 'Local atualizado com sucesso' });
    }
  );
});

// Desativar local
router.delete('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE locais SET ativo = 0 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao desativar local' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Local nao encontrado' });
    }
    res.json({ mensagem: 'Local desativado com sucesso' });
  });
});

// Reativar local
router.put('/:id/reativar', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE locais SET ativo = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao reativar local' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Local nao encontrado' });
    }
    res.json({ mensagem: 'Local reativado com sucesso' });
  });
});

// Listar locais ativos (para selects)
router.get('/ativos/lista', autenticar, (req, res) => {
  db.all('SELECT id, nome FROM locais WHERE ativo = 1 ORDER BY nome', (err, locais) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar locais' });
    }
    res.json(locais);
  });
});

module.exports = router;
