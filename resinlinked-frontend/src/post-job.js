document.getElementById('post-job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const job = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    price: document.getElementById('price').value,
    skillsRequired: document.getElementById('skillsRequired').value.split(',').map(s => s.trim()),
    barangay: document.getElementById('barangay').value
  };

  try {
    const token = localStorage.getItem('token'); // Make sure login sets this
    const res = await fetch('http://localhost:5000/api/jobs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(job)
    });

    const data = await res.json();
    alert(data.message || 'Job posted successfully.');
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});
