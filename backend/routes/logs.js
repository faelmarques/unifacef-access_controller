const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar, autenticarDispositivo } = require('./middleware');

// Listar logs (para o dashboard)
router.get('/', autenticar, (req, res) => {
  const { data_inicio, data_fim, tag, tipo, limite } = req.query;

  let sql = `
    SELECT l.*, t.proprietario, t.veiculo, t.placa, t.departamento
    FROM logs l
    LEFT JOIN tags t ON l.tag_codigo = t.codigo
    WHERE 1=1
  `;
  const params = [];

  if (data_inicio) {
    sql += ' AND l.criado_em >= ?';
    params.push(data_inicio);
  }

  if (data_fim) {
    sql += ' AND l.criado_em <= ?';
    params.push(data_fim);
  }

  if (tag) {
    sql += ' AND l.tag_codigo LIKE ?';
    params.push(`%${tag}%`);
  }

  if (tipo) {
    sql += ' AND l.tipo = ?';
    params.push(tipo);
  }

  sql += ' ORDER BY l.criado_em DESC';

  if (limite) {
    sql += ' LIMIT ?';
    params.push(parseInt(limite));
  } else {
    sql += ' LIMIT 500';
  }

  db.all(sql, params, (err, logs) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar logs' });
    }
    res.json(logs);
  });
});

// Estatisticas de acesso
router.get('/stats', autenticar, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) as total_acessos,
      SUM(CASE WHEN tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'SAIDA' THEN 1 ELSE 0 END) as saidas,
      SUM(CASE WHEN tipo = 'NEGADO' THEN 1 ELSE 0 END) as negados
    FROM logs
    WHERE criado_em >= datetime('now', '-24 hours')
  `;

  db.get(sql, (err, stats) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar estatisticas' });
    }
    res.json(stats);
  });
});

// Acessos por hora (grafico)
router.get('/stats/por-hora', autenticar, (req, res) => {
  const sql = `
    SELECT
      strftime('%H', criado_em) as hora,
      COUNT(*) as total,
      tipo
    FROM logs
    WHERE criado_em >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', criado_em), tipo
    ORDER BY hora
  `;

  db.all(sql, (err, stats) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar estatisticas por hora' });
    }
    res.json(stats);
  });
});

// Top usuarios mais ativos
router.get('/stats/top-usuarios', autenticar, (req, res) => {
  const sql = `
    SELECT
      l.tag_codigo,
      t.proprietario,
      t.placa,
      t.departamento,
      COUNT(*) as total_acessos
    FROM logs l
    LEFT JOIN tags t ON l.tag_codigo = t.codigo
    WHERE l.tipo = 'ENTRADA'
      AND l.criado_em >= datetime('now', '-7 days')
    GROUP BY l.tag_codigo
    ORDER BY total_acessos DESC
    LIMIT 10
  `;

  db.all(sql, (err, stats) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar top usuarios' });
    }
    res.json(stats);
  });
});

// Registrar acesso (chamado pelo ESP32)
router.post('/registrar', autenticarDispositivo, (req, res) => {
  const { tag_codigo, tipo, dispositivo, observacao } = req.body;

  if (!tag_codigo || !tipo) {
    return res.status(400).json({ erro: 'Tag e tipo sao obrigatorios' });
  }

  db.run(
    'INSERT INTO logs (tag_codigo, tipo, dispositivo, observacao) VALUES (?, ?, ?, ?)',
    [tag_codigo, tipo, dispositivo || 'N/A', observacao || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao registrar acesso' });
      }

      res.status(201).json({
        id: this.lastID,
        mensagem: 'Acesso registrado com sucesso'
      });
    }
  );
});

// Verificar tag (chamado pelo ESP32 para liberar cancela)
router.get('/verificar/:codigo', autenticarDispositivo, (req, res) => {
  const { codigo } = req.params;

  db.get('SELECT * FROM tags WHERE codigo = ? AND ativo = 1', [codigo], (err, tag) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao verificar tag' });
    }

    if (tag) {
      res.json({
        autorizado: true,
        proprietario: tag.proprietario,
        veiculo: tag.veiculo,
        placa: tag.placa
      });
    } else {
      res.json({ autorizado: false });
    }
  });
});

// Ultimos 5 acessos (para interface da portaria - sem autenticacao)
router.get('/ultimos', (req, res) => {
  const sql = `
    SELECT l.*, t.proprietario, t.veiculo, t.placa, t.departamento
    FROM logs l
    LEFT JOIN tags t ON l.tag_codigo = t.codigo
    ORDER BY l.criado_em DESC
    LIMIT 5
  `;

  db.all(sql, [], (err, logs) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar ultimos acessos' });
    }
    res.json(logs);
  });
});

module.exports = router;
