const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ erro: 'Token nao fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token invalido ou expirado' });
  }
}

function autenticarDispositivo(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ erro: 'API key nao fornecida' });
  }

  if (apiKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ erro: 'API key invalida' });
  }

  next();
}

module.exports = { autenticar, autenticarDispositivo };
