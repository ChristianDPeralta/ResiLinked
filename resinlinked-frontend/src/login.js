document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const loginError = document.getElementById("loginError");
  loginError.textContent = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.location.href = "/dashboard.html";
    } else {
      loginError.textContent = (data.alert || "Hindi matagumpay ang pag-login.");
    }
  } catch (err) {
    loginError.textContent = "May problema sa koneksyon.";
  }
});

document.getElementById('backHomeBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 300);
};
document.getElementById('registerLinkBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/register.html';
  }, 300);
};