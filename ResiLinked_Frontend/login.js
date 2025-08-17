document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginError = document.getElementById("loginError");
  loginError.textContent = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      loginError.textContent = data.alert || "Hindi matagumpay ang pag-login.";
    }
  } catch (err) {
    loginError.textContent = "May problema sa koneksyon.";
  }
});