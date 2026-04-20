// ==========================================
// Authentication Utilities
// ==========================================

/**
 * Save authentication token and user data to localStorage
 */
function saveAuth(token, user, refreshToken) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
}

/**
 * Get stored authentication token
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Get stored user data
 */
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get refresh token
 */
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

/**
 * Clear all authentication data
 */
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
}

/**
 * Fetch with automatic token inclusion and refresh
 */
async function authFetch(url, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(url, {
    ...options,
    headers
  });
  
  // If token expired, try to refresh
  if (response.status === 403) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const user = getUser();
          saveAuth(data.token, user, refreshToken);
          
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${data.token}`;
          response = await fetch(url, {
            ...options,
            headers
          });
        } else {
          // Refresh failed, redirect to login
          clearAuth();
          window.location.href = '/login.html';
        }
      } catch (error) {
        clearAuth();
        window.location.href = '/login.html';
      }
    } else {
      clearAuth();
      window.location.href = '/login.html';
    }
  }
  
  // If unauthorized, redirect to login
  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login.html';
  }
  
  return response;
}

/**
 * Logout user
 */
async function logout() {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearAuth();
    window.location.href = '/login.html';
  }
}

/**
 * Show error message
 */
function showError(message, details = null) {
  const errorBox = document.getElementById('error-message');
  if (errorBox) {
    errorBox.style.display = 'block';
    let html = `<strong>Error:</strong> ${message}`;
    
    if (details && Array.isArray(details)) {
      html += '<ul>';
      details.forEach(detail => {
        html += `<li>${detail.message || detail}</li>`;
      });
      html += '</ul>';
    }
    
    errorBox.innerHTML = html;
    
    // Scroll to error
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorBox = document.getElementById('error-message');
  if (errorBox) {
    errorBox.style.display = 'none';
  }
}

// ==========================================
// Login Form Handler
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Iniciando sesión...';
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        saveAuth(data.token, data.user, data.refreshToken);
        
        // Show success message briefly
        submitButton.textContent = '✅ Login exitoso';
        submitButton.style.backgroundColor = '#10b981';
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        showError(data.error || 'Error al iniciar sesión');
        
        if (data.remainingAttempts !== undefined) {
          showError(`${data.error}. Te quedan ${data.remainingAttempts} intento${data.remainingAttempts !== 1 ? 's' : ''}`);
        }
        
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Error de conexión. Por favor verifica tu conexión a internet.');
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
}

// ==========================================
// Register Form Handler
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    
    // Validate password strength
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showError('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
      return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando...';
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        saveAuth(data.token, data.user, data.refreshToken);
        
        // Show success message
        submitButton.textContent = '✅ Registro exitoso';
        submitButton.style.backgroundColor = '#10b981';
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        if (data.errors) {
          showError(data.error || 'Errores de validación', data.errors);
        } else {
          showError(data.error || 'Error al registrar usuario');
        }
        
        submitButton.disabled = false;
        submitButton.textContent = 'Registrarse';
      }
    } catch (error) {
      console.error('Register error:', error);
      showError('Error de conexión. Por favor verifica tu conexión a internet.');
      submitButton.disabled = false;
      submitButton.textContent = 'Registrarse';
    }
  });
}

// ==========================================
// Auth Check on Load
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // If on login/register page and already authenticated, redirect to dashboard
  if ((currentPath === '/login.html' || currentPath === '/register.html') && isAuthenticated()) {
    window.location.href = '/';
  }
  
  // If on protected page and not authenticated, redirect to login
  if (currentPath === '/' && !isAuthenticated()) {
    // Allow public access to dashboard for now - can be changed later
    // window.location.href = '/login.html';
  }
});

// Export functions for use in other scripts
window.authUtils = {
  saveAuth,
  getToken,
  getUser,
  getRefreshToken,
  clearAuth,
  isAuthenticated,
  authFetch,
  logout,
  showError,
  hideError
};
