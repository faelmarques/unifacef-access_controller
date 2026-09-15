const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { autenticar } = require('./middleware');

// Login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, usuario) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }

    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  });
});

// Verificar token valido
router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

// Alterar senha
router.put('/senha', autenticar, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Senha atual e nova senha sao obrigatorias' });
  }

  db.get('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id], (err, usuario) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }

    const senhaValida = bcrypt.compareSync(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha atual incorreta' });
    }

    const novaSenhaHash = bcrypt.hashSync(novaSenha, 10);
    db.run('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenhaHash, req.usuario.id], (err) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao atualizar senha' });
      }
      res.json({ mensagem: 'Senha atualizada com sucesso' });
    });
  });
});

module.exports = router;
