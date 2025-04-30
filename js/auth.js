function checkAuth() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
      window.location.replace('/index.html');
    }
    return userRole;
  }
  
  function logout() {
    localStorage.removeItem('userRole');
    window.location.replace('/index.html');
  }