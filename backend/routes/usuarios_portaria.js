const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { autenticar } = require('./middleware');

// Listar todos os usuarios da portaria
router.get('/', autenticar, (req, res) => {
  db.all('SELECT id, nome, usuario, ativo, criado_em FROM usuarios_portaria ORDER BY criado_em DESC', (err, usuarios) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar usuarios' });
    }
    res.json(usuarios);
  });
});

// Cadastrar novo usuario da portaria
router.post('/', autenticar, (req, res) => {
  const { nome, usuario, senha } = req.body;

  if (!nome || !usuario || !senha) {
    return res.status(400).json({ erro: 'Nome, usuario e senha sao obrigatorios' });
  }

  // Verificar se usuario ja existe
  db.get('SELECT id FROM usuarios_portaria WHERE usuario = ?', [usuario], (err, existente) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao verificar usuario' });
    }

    if (existente) {
      return res.status(400).json({ erro: 'Usuario ja cadastrado' });
    }

    const senhaHash = bcrypt.hashSync(senha, 10);

    db.run(
      'INSERT INTO usuarios_portaria (nome, usuario, senha) VALUES (?, ?, ?)',
      [nome, usuario, senhaHash],
      function (err) {
        if (err) {
          return res.status(500).json({ erro: 'Erro ao cadastrar usuario' });
        }

        res.status(201).json({
          id: this.lastID,
          mensagem: 'Usuario cadastrado com sucesso'
        });
      }
    );
  });
});

// Atualizar usuario da portaria
router.put('/:id', autenticar, (req, res) => {
  const { id } = req.params;
  const { nome, usuario, senha, ativo } = req.body;

  // Se vai atualizar a senha
  if (senha) {
    const senhaHash = bcrypt.hashSync(senha, 10);
    db.run(
      'UPDATE usuarios_portaria SET nome = COALESCE(?, nome), usuario = COALESCE(?, usuario), senha = ?, ativo = COALESCE(?, ativo) WHERE id = ?',
      [nome, usuario, senhaHash, ativo, id],
      function (err) {
        if (err) {
          return res.status(500).json({ erro: 'Erro ao atualizar usuario' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ erro: 'Usuario nao encontrado' });
        }
        res.json({ mensagem: 'Usuario atualizado com sucesso' });
      }
    );
  } else {
    db.run(
      'UPDATE usuarios_portaria SET nome = COALESCE(?, nome), usuario = COALESCE(?, usuario), ativo = COALESCE(?, ativo) WHERE id = ?',
      [nome, usuario, ativo, id],
      function (err) {
        if (err) {
          return res.status(500).json({ erro: 'Erro ao atualizar usuario' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ erro: 'Usuario nao encontrado' });
        }
        res.json({ mensagem: 'Usuario atualizado com sucesso' });
      }
    );
  }
});

// Desativar usuario da portaria
router.delete('/:id', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE usuarios_portaria SET ativo = 0 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao desativar usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Usuario nao encontrado' });
    }
    res.json({ mensagem: 'Usuario desativado com sucesso' });
  });
});

// Reativar usuario da portaria
router.put('/:id/reativar', autenticar, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE usuarios_portaria SET ativo = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao reativar usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Usuario nao encontrado' });
    }
    res.json({ mensagem: 'Usuario reativado com sucesso' });
  });
});

// Login da portaria (publico)
router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Usuario e senha sao obrigatorios' });
  }

  db.get('SELECT * FROM usuarios_portaria WHERE usuario = ? AND ativo = 1', [usuario], (err, user) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar usuario' });
    }

    if (!user) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const senhaValida = bcrypt.compareSync(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, usuario: user.usuario, tipo: 'portaria' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario
      }
    });
  });
});

module.exports = router;
