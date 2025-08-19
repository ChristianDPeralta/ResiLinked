document.getElementById('reset-request-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message || 'If account exists, reset email sent.');
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});
