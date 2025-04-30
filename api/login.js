const cors = require('cors');
const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Configurações
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Login
app.post('/api/login', (req, res) => {
  console.log('[API] Requisição recebida em /api/login');
  const { username, password } = req.body;
  const validUsers = {
    admin: { password: 'admin123', role: 'admin' },
    teacher: { password: 'teacher123', role: 'teacher' }
  };

  if (validUsers[username] && validUsers[username].password === password) {
    console.log(`[LOGIN] ${username} autenticado como ${validUsers[username].role}`);
    res.json({
      success: true,
      role: validUsers[username].role,
      redirect: '/dashboard.html'
    });
  } else {
    console.log(`[LOGIN] Tentativa falha: ${username}`);
    res.status(401).json({
      success: false,
      message: 'Usuário ou senha inválidos'
    });
  }
});

// Exportar como função serverless
module.exports.handler = serverless(app);