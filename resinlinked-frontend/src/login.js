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
        console.log("Sending login request:", { email, password });

        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: 'include' // maintain cookies/session
        });

        const data = await res.json();
        console.log("Response from server:", data);

        if (res.ok && data.success) {
          // Redirect to landing page after successful login
          window.location.href = "/landing.html";
        } else if (res.status === 401) {
          loginError.textContent = "Maling email o password.";
        } else {
          loginError.textContent = data.message || "Hindi matagumpay ang pag-login.";
        }

      } catch (err) {
        console.error("Login fetch error:", err);
        loginError.textContent = "May problema sa koneksyon.";
      }
    });
  }

  if (backHomeBtn) {
    backHomeBtn.onclick = () => {
      document.body.classList.remove('fade-in');
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 300);
    };
  }

  if (registerLinkBtn) {
    registerLinkBtn.onclick = () => {
      document.body.classList.remove('fade-in');
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = '/register.html';
      }, 300);
    };
  }
});
