require('dotenv').config();
const cors = require('cors');
const express = require('express');
const serverless = require('serverless-http');
require('dotenv').config(); // Para usar variáveis de ambiente

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

  // Usuários válidos utilizando variáveis de ambiente
  const validUsers = {
    admin: { password: process.env.ADMIN_PASSWORD, role: 'admin' },
    teacher: { password: process.env.TEACHER_PASSWORD, role: 'teacher' }
  };

  if (!username || !password) {
    console.log('[LOGIN] Dados insuficientes fornecidos');
    return res.status(400).json({
      success: false,
      message: 'Por favor, forneça nome de usuário e senha.'
    });
  }

  if (validUsers[username] && validUsers[username].password === password) {
    console.log(`[LOGIN] ${username} autenticado como ${validUsers[username].role}`);
    return res.json({
      success: true,
      role: validUsers[username].role,
      redirect: '/dashboard.html'
    });
  } else {
    console.log(`[LOGIN] Tentativa falha: ${username}`);
    return res.status(401).json({
      success: false,
      message: 'Usuário ou senha inválidos.'
    });
  }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// Exportar como função serverless
module.exports.handler = serverless(app);
