const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// =============== CONFIGURAÇÕES ===============
app.use(cors({
  origin: '*', // Permitir todas as origens (ou especifique o domínio do Vercel)
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// =============== ROTAS DA API ===============

// Rota de Login
app.post('/api/login', (req, res) => {
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

// Servir arquivos CSV
app.get('/data/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'data', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Arquivo não encontrado');
    }

    res.sendFile(filePath);
    console.log(`[CSV] Arquivo ${filename} servido`);

  } catch (error) {
    console.error(`[ERRO CSV] ${error.message}`);
    res.status(404).send(error.message);
  }
});

// Rota padrão para SPA (já que express.static já serve os arquivos)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =============== TRATAMENTO DE ERROS ===============
app.use((err, req, res, next) => {
  console.error(`[ERRO GLOBAL] ${err.stack}`);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// =============== INICIAR SERVIDOR ===============
app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Acesse: http://localhost:${PORT}`);
  console.log(`=================================\n`);
});
