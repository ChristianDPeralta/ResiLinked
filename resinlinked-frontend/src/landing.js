import apiService from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Load popular jobs and top rated users
  await loadPopularJobs();
  await loadTopRatedUsers();
});

async function loadPopularJobs() {
  try {
    const response = await fetch('http://localhost:5000/api/jobs/popular');
    let jobs = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || data || [];
    }
    
    renderPopularJobs(jobs);
  } catch (error) {
    console.error("Error loading popular jobs:", error);
    renderPopularJobs([]);
  }
}

function renderPopularJobs(jobs) {
  const jobsContainer = document.getElementById('popularJobs');
  if (!jobsContainer) return;
  
  if (!jobs || jobs.length === 0) {
    jobsContainer.innerHTML = '<p class="no-data">No jobs available at the moment</p>';
    return;
  }
  
  // Limit to 9 jobs for display
  const popularJobs = jobs.slice(0, 9);
  
  jobsContainer.innerHTML = popularJobs.map(job => `
    <div class="job-card" data-id="${job._id}">
      ${job.title}<br>
      <span>${job.barangay || 'Various locations'}</span>
    </div>
  `).join('');
  
  // Add click event to job cards
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      const jobId = card.getAttribute('data-id');
      window.location.href = `/job-details.html?id=${jobId}`;
    });
  });
}

async function loadTopRatedUsers() {
  try {
    const response = await fetch('http://localhost:5000/api/ratings/top-rated');
    let users = [];
    
    if (response.ok) {
      users = await response.json();
    }
    
    renderTopRatedUsers(users);
  } catch (error) {
    console.error("Error loading top rated users:", error);
    renderTopRatedUsers([]);
  }
}

function renderTopRatedUsers(users) {
  const testimonialsContainer = document.getElementById('topRatedUsers');
  if (!testimonialsContainer) return;
  
  if (!users || users.length === 0) {
    testimonialsContainer.innerHTML = '<p class="no-data">No user ratings yet</p>';
    return;
  }
  
  // Limit to 3 testimonials
  const topUsers = users.slice(0, 3);
  
  testimonialsContainer.innerHTML = topUsers.map(user => {
    const rating = user.averageRating ? user.averageRating.toFixed(1) : '0';
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    
    return `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars}</div>
        <div class="testimonial-content">Rated ${rating}/5 stars</div>
        <div class="testimonial-footer">
          <span class="testimonial-avatar"></span>
          <span class="testimonial-name">${user.firstName} ${user.lastName}</span>
          <span class="testimonial-role">${user.skills && user.skills.length > 0 ? user.skills[0] : 'Service Provider'}</span>
        </div>
      </div>
    `;
  }).join('');
}