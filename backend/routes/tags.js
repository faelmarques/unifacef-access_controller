const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('./middleware');

// Listar todas as tags
router.get('/', autenticar, (req, res) => {
  const { busca, departamento, ativo } = req.query;

  let sql = 'SELECT * FROM tags WHERE 1=1';
  const params = [];

  if (busca) {
    sql += ' AND (codigo LIKE ? OR proprietario LIKE ? OR placa LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  if (departamento) {
    sql += ' AND departamento = ?';
    params.push(departamento);
  }

  if (ativo !== undefined) {
    sql += ' AND ativo = ?';
    params.push(ativo === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY criado_em DESC';

  db.all(sql, params, (err, tags) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar tags' });
    }
    res.json(tags);
  });
});

// Buscar tag por ID
router.get('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM tags WHERE id = ?', [id], (err, tag) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar tag' });
    }

    if (!tag) {
      return res.status(404).json({ erro: 'Tag nao encontrada' });
    }

    res.json(tag);
  });
});

// Cadastrar nova tag
router.post('/', autenticar, (req, res) => {
  const { codigo, proprietario, veiculo, placa, departamento } = req.body;

  if (!codigo || !proprietario) {
    return res.status(400).json({ erro: 'Codigo e proprietario sao obrigatorios' });
  }

  // Verificar se tag ja existe
  db.get('SELECT id FROM tags WHERE codigo = ?', [codigo], (err, existente) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao verificar tag' });
    }

    if (existente) {
      return res.status(400).json({ erro: 'Tag ja cadastrada no sistema' });
    }

    db.run(
      'INSERT INTO tags (codigo, proprietario, veiculo, placa, departamento) VALUES (?, ?, ?, ?, ?)',
      [codigo, proprietario, veiculo || '', placa || '', departamento || ''],
      function (err) {
        if (err) {
          return res.status(500).json({ erro: 'Erro ao cadastrar tag' });
        }

        res.status(201).json({
          id: this.lastID,
          mensagem: 'Tag cadastrada com sucesso'
        });
      }
    );
  });
});

// Atualizar tag
router.put('/:id', autenticar, (req, res) => {
  const { id } = req.params;
  const { codigo, proprietario, veiculo, placa, departamento, ativo } = req.body;

  db.run(
    `UPDATE tags SET
      codigo = COALESCE(?, codigo),
      proprietario = COALESCE(?, proprietario),
      veiculo = COALESCE(?, veiculo),
      placa = COALESCE(?, placa),
      departamento = COALESCE(?, departamento),
      ativo = COALESCE(?, ativo)
    WHERE id = ?`,
    [codigo, proprietario, veiculo, placa, departamento, ativo, id],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao atualizar tag' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ erro: 'Tag nao encontrada' });
      }

      res.json({ mensagem: 'Tag atualizada com sucesso' });
    }
  );
});

// Desativar tag (soft delete)
router.delete('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE tags SET ativo = 0 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao desativar tag' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Tag nao encontrada' });
    }

    res.json({ mensagem: 'Tag desativada com sucesso' });
  });
});

// Reativar tag
router.put('/:id/reativar', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE tags SET ativo = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao reativar tag' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Tag nao encontrada' });
    }

    res.json({ mensagem: 'Tag reativada com sucesso' });
  });
});

// Estatisticas
router.get('/stats/geral', autenticar, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativas,
      SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativas
    FROM tags
  `;

  db.get(sql, (err, stats) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar estatisticas' });
    }
    res.json(stats);
  });
});

module.exports = router;
