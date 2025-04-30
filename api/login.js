module.exports = async (req, res) => {
  try {
    console.log('[API] Requisição recebida em /api/login');
    console.log('[API] Método:', req.method);
    console.log('[API] Corpo da requisição:', req.body);

    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Verificar se o método é POST
    if (req.method !== 'POST') {
      console.log('[API] Método não permitido:', req.method);
      return res.status(405).json({
        success: false,
        message: 'Método não permitido'
      });
    }

    // Parsear o corpo da requisição
    if (!req.body || !req.body.username || !req.body.password) {
      console.log('[API] Corpo da requisição inválido:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição inválido'
      });
    }

    const { username, password } = req.body;

    // Acessar variáveis de ambiente
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher123';
    console.log('[API] Variáveis de ambiente - ADMIN_PASSWORD:', ADMIN_PASSWORD);
    console.log('[API] Variáveis de ambiente - TEACHER_PASSWORD:', TEACHER_PASSWORD);

    const validUsers = {
      admin: { password: ADMIN_PASSWORD, role: 'admin' },
      teacher: { password: TEACHER_PASSWORD, role: 'teacher' }
    };

    if (validUsers[username] && validUsers[username].password === password) {
      console.log(`[LOGIN] ${username} autenticado como ${validUsers[username].role}`);
      return res.status(200).json({
        success: true,
        role: validUsers[username].role,
        redirect: '/dashboard.html'
      });
    } else {
      console.log(`[LOGIN] Tentativa falha: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos'
      });
    }
  } catch (error) {
    console.error('[API] Erro interno:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};