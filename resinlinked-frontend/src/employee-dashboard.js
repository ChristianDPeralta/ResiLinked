import apiService from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is employee
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.userType !== 'employee' && userData.userType !== 'both') {
    alert('Employee access required');
    window.location.href = '/landing.html';
    return;
  }

  await loadEmployeeData();
  await loadRecommendedJobs();
  await loadApplications();
});

async function loadEmployeeData() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const response = await apiService.getProfile(userData.userId);
    
    if (response.user) {
      document.getElementById('applicationsCount').textContent = response.user.applicationCount || 0;
      document.getElementById('offersCount').textContent = response.user.offersCount || 0;
      document.getElementById('viewsCount').textContent = response.user.profileViews || 0;

      const ratingsResponse = await apiService.getUserRatings(userData.userId);
      if (ratingsResponse.averageRating) {
        document.getElementById('ratingValue').textContent = ratingsResponse.averageRating.toFixed(1);
      }
    }
  } catch (error) {
    console.error('Error loading employee data:', error);
  }
}

async function loadRecommendedJobs() {
  try {
    const response = await apiService.getJobs({ limit: 6 });
    renderRecommendedJobs(response.jobs || []);
  } catch (error) {
    console.error('Error loading recommended jobs:', error);
    document.getElementById('jobsContainer').innerHTML = '<div class="no-data">Error loading jobs</div>';
  } finally {
    document.getElementById('jobsLoading').style.display = 'none';
  }
}

function renderRecommendedJobs(jobs) {
  const jobsContainer = document.getElementById('jobsContainer');
  
  if (!jobs || jobs.length === 0) {
    jobsContainer.innerHTML = '<div class="no-data">No recommended jobs found</div>';
    return;
  }
  
  jobsContainer.innerHTML = jobs.map(job => `
    <div class="job-card">
      <h3 class="job-title">${job.title || 'Untitled Job'}</h3>
      <div class="job-price">₱${job.price || 0}</div>
      <div class="job-meta">
        <div class="meta-item"><i>📍</i> ${job.barangay || 'N/A'}</div>
        <div class="meta-item"><i>👤</i> ${job.applicants ? job.applicants.length : 0} applicants</div>
      </div>
      <p>${job.description ? job.description.substring(0, 100) + '...' : 'No description available'}</p>
      <div class="action-buttons">
        <button class="btn primary" onclick="applyForJob('${job._id}')">Apply Now</button>
        <button class="btn" onclick="viewJob('${job._id}')">View Details</button>
      </div>
    </div>
  `).join('');
}

async function loadApplications() {
  try {
    const applicationsContainer = document.getElementById('applicationsContainer');
    applicationsContainer.innerHTML = '<div class="no-data">Loading your applications...</div>';
    
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/jobs/my-applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const applications = await response.json();
      renderApplications(applications);
    } else {
      applicationsContainer.innerHTML = '<div class="no-data">Error loading applications</div>';
    }
  } catch (error) {
    console.error('Error loading applications:', error);
    document.getElementById('applicationsContainer').innerHTML = '<div class="no-data">Error loading applications</div>';
  } finally {
    document.getElementById('applicationsLoading').style.display = 'none';
  }
}

function renderApplications(applications) {
  const applicationsContainer = document.getElementById('applicationsContainer');
  
  if (!applications || applications.length === 0) {
    applicationsContainer.innerHTML = '<div class="no-data">You haven\'t applied to any jobs yet</div>';
    return;
  }
  
  applicationsContainer.innerHTML = applications.map(app => {
    const job = app.jobId || {}; // ✅ fallback if jobId is not populated
    return `
      <div class="job-card">
        <h3 class="job-title">${job.title || 'Unknown Job'}</h3>
        <div class="job-price">₱${job.price || 0}</div>
        <div class="job-meta">
          <div class="meta-item"><i>📍</i> ${job.barangay || 'N/A'}</div>
          <div class="meta-item">Status: ${app.status || 'Pending'}</div>
          <div class="meta-item">Applied: ${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</div>
        </div>
        <div class="action-buttons">
          <button class="btn" onclick="viewJob('${job._id || ''}')">View Job</button>
          ${app.status === 'accepted' ? 
            `<button class="btn primary" onclick="acceptOffer('${app._id}')">Accept Offer</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Global functions for button clicks
window.applyForJob = async function(jobId) {
  try {
    const result = await apiService.applyToJob(jobId);
    if (result.success) {
      alert('Application submitted successfully!');
      loadApplications();
    } else {
      alert(result.message || 'Error applying for job');
    }
  } catch (error) {
    console.error('Error applying for job:', error);
    alert('Failed to apply for job');
  }
};

window.viewJob = function(jobId) {
  if (!jobId) {
    alert('Job details unavailable.');
    return;
  }
  window.location.href = `/job-details.html?id=${jobId}`;
};

window.acceptOffer = function(applicationId) {
  alert(`Would accept offer for application ${applicationId}`);
};
