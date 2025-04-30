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
  
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
  
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userRole', data.role);
            window.location.replace('/dashboard.html'); // Usar replace para evitar histórico
        } else {
            alert(data.message || 'Erro no login!');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert(`Falha na conexão com o servidor: ${error.message}`);
    }
});

