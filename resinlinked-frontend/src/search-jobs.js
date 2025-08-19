document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const query = {
    skill: document.getElementById('skill').value,
    barangay: document.getElementById('barangay').value
  };

  try {
    const res = await fetch(`http://localhost:5000/api/jobs/search?skill=${query.skill}&barangay=${query.barangay}`);
    const jobs = await res.json();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = jobs.length 
      ? jobs.map(j => `<div><h3>${j.title}</h3><p>${j.description}</p><p>Price: ${j.price}</p></div>`).join('')
      : '<p>No jobs found.</p>';
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});
