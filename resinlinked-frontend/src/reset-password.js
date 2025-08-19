document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('token').value;
  const newPassword = document.getElementById('newPassword').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json();
    alert(data.message || 'Password reset successfully.');
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});
