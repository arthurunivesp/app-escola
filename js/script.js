document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
      const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {
          localStorage.setItem('userRole', data.role);

          // 🚀 Redireciona primeiro para `dashboard.html`
          window.location.href = '/dashboard.html';
      } else {
          alert(data.message || 'Erro no login!');
      }
  } catch (error) {
      console.error('Erro:', error);
      alert('Falha na conexão com o servidor');
  }
});

