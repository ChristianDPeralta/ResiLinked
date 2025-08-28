import apiService from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Get URL parameters for filtering
  const urlParams = new URLSearchParams(window.location.search);
  const skillFilter = urlParams.get('skill');
  const barangayFilter = urlParams.get('barangay');
  
  // Set filter values if provided
  if (skillFilter) {
    document.getElementById('skillFilter').value = skillFilter;
  }
  if (barangayFilter) {
    document.getElementById('barangayFilter').value = barangayFilter;
  }
  
  // Load jobs with filters
  await loadJobs();
  
  // Set up search/filter handlers
  document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadJobs();
  });
  
  // Set up tab switching
  document.getElementById('searchTab').addEventListener('click', () => {
    switchTab('search');
  });
  
  document.getElementById('appliedTab').addEventListener('click', () => {
    switchTab('applied');
  });
});

async function loadJobs() {
  try {
    const skill = document.getElementById('skillFilter').value;
    const barangay = document.getElementById('barangayFilter').value;
    const searchText = document.getElementById('searchInput').value;
    
    const filters = {
      isOpen: true
    };
    
    if (skill) filters.skill = skill;
    if (barangay) filters.barangay = barangay;
    if (searchText) filters.search = searchText;
    
    const response = await apiService.getJobs(filters);
    renderJobs(response.jobs || []);
  } catch (error) {
    console.error("Error loading jobs:", error);
    alert("Failed to load jobs");
  }
}

function renderJobs(jobs) {
  const jobsContainer = document.getElementById('jobsList');
  if (!jobsContainer) return;
  
  if (!jobs || jobs.length === 0) {
    jobsContainer.innerHTML = '<p class="no-data">No jobs found matching your criteria</p>';
    return;
  }
  
  jobsContainer.innerHTML = jobs.map(job => `
    <div class="job-card" data-id="${job._id}">
      <div class="job-title">${job.title}</div>
      <div class="job-positions">${job.applicants ? job.applicants.length : 0} applicants</div>
      <div class="job-salary">₱${job.price}/job</div>
      <button class="apply-btn" data-id="${job._id}">APPLY</button>
    </div>
  `).join('');
  
  // Add event listeners
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking the apply button
      if (e.target.classList.contains('apply-btn')) return;
      
      const jobId = card.getAttribute('data-id');
      window.location.href = `/job-details.html?id=${jobId}`;
    });
  });
  
  document.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const jobId = btn.getAttribute('data-id');
      await applyToJob(jobId, btn);
    });
  });
}

async function applyToJob(jobId, button) {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to apply for jobs');
      window.location.href = '/login.html';
      return;
    }
    
    button.disabled = true;
    button.textContent = 'Applying...';
    
    const response = await apiService.applyToJob(jobId);
    alert(response.message || 'Application submitted successfully!');
    button.textContent = 'Applied';
    button.disabled = true;
  } catch (error) {
    console.error("Error applying to job:", error);
    alert(error.message || 'Failed to apply to job');
    button.textContent = 'Apply';
    button.disabled = false;
  }
}

function switchTab(tab) {
  const searchTab = document.getElementById('searchTab');
  const appliedTab = document.getElementById('appliedTab');
  const jobsList = document.getElementById('jobsList');
  const appliedList = document.getElementById('appliedList');
  
  if (tab === 'search') {
    searchTab.classList.add('active');
    appliedTab.classList.remove('active');
    jobsList.style.display = 'grid';
    appliedList.style.display = 'none';
  } else {
    searchTab.classList.remove('active');
    appliedTab.classList.add('active');
    jobsList.style.display = 'none';
    appliedList.style.display = 'grid';
    loadAppliedJobs();
  }
}

async function loadAppliedJobs() {
  try {
    const appliedList = document.getElementById('appliedList');
    appliedList.innerHTML = '<div class="no-data">Loading your applications...</div>';
    
    // Get current user's applied jobs
    const token = localStorage.getItem('token');
    if (!token) {
      appliedList.innerHTML = '<div class="no-data">Please login to view your applications</div>';
      return;
    }
    
    const response = await fetch('http://localhost:5000/api/jobs/my-applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const applications = await response.json();
      renderAppliedJobs(applications);
    } else {
      appliedList.innerHTML = '<div class="no-data">Error loading applications</div>';
    }
  } catch (error) {
    console.error("Error loading applied jobs:", error);
    document.getElementById('appliedList').innerHTML = '<div class="no-data">Error loading applications</div>';
  }
}

function renderAppliedJobs(applications) {
  const appliedList = document.getElementById('appliedList');
  if (!applications || applications.length === 0) {
    appliedList.innerHTML = '<div class="no-data">You haven\'t applied to any jobs yet</div>';
    return;
  }
  
  appliedList.innerHTML = applications.map(app => `
    <div class="job-card">
      <div class="job-title">${app.jobId.title}</div>
      <div class="job-salary">₱${app.jobId.price}</div>
      <div class="status-chip">${app.status || 'Pending'}</div>
    </div>
  `).join('');
}