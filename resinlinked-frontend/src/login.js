import apiService from './api.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const backHomeBtn = document.getElementById('backHomeBtn');
  const registerLinkBtn = document.getElementById('registerLinkBtn');

  if (loginForm && loginError) {
    loginForm.addEventListener("submit", async function(event) {
      event.preventDefault();
      loginError.textContent = "";

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const data = await apiService.login({ email, password });
        
        if (data.success) {
          // Store token and user data
          localStorage.setItem('token', data.token);
          localStorage.setItem('userData', JSON.stringify({
            userId: data.userId,
            userType: data.userType,
            isVerified: data.isVerified
          }));
          
          // Redirect based on user type
          if (data.userType === 'admin') {
            window.location.href = "/admin-dashboard.html";
          } else {
            window.location.href = "/landing.html";
          }
        } else {
          loginError.textContent = data.alert || "Invalid email or password";
        }
      } catch (err) {
        console.error("Login error:", err);
        loginError.textContent = err.message || "Connection error. Please try again.";
      }
    });
  }

  if (backHomeBtn) {
    backHomeBtn.onclick = () => {
      window.location.href = '/index.html';
    };
  }

  if (registerLinkBtn) {
    registerLinkBtn.onclick = () => {
      window.location.href = '/register.html';
    };
  }
});