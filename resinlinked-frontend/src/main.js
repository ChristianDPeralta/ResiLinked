document.getElementById('loginBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 300);
};
document.getElementById('registerBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/register.html';
  }, 300);
};