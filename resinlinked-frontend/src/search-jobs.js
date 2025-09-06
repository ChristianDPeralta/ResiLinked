// Enhanced job search with filtering functionality
const API_BASE = 'http://localhost:5000/api';

// Initialize search functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the search jobs page
  if (document.getElementById('search-form')) {
    initializeSearchForm();
  }
});

function initializeSearchForm() {
  const searchForm = document.getElementById('search-form');
  
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = {
      skill: document.getElementById('skill').value,
      barangay: document.getElementById('barangay').value,
      minPrice: document.getElementById('minPrice')?.value,
      maxPrice: document.getElementById('maxPrice')?.value
    };

    await searchJobs(query);
  });
}

async function searchJobs(query) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (query.skill) params.append('skill', query.skill);
    if (query.barangay) params.append('barangay', query.barangay);
    if (query.minPrice) params.append('minPrice', query.minPrice);
    if (query.maxPrice) params.append('maxPrice', query.maxPrice);

    const response = await fetch(`${API_BASE}/jobs/search?${params}`);
    const data = await response.json();
    
    const resultsDiv = document.getElementById('results');
    
    if (data.success && data.data && data.data.length > 0) {
      resultsDiv.innerHTML = data.data.map(job => `
        <div class="job-result">
          <h3>${job.title}</h3>
          <p><strong>Description:</strong> ${job.description || 'No description available'}</p>
          <p><strong>Location:</strong> ${job.barangay}</p>
          <p><strong>Price:</strong> ₱${job.price.toLocaleString()}</p>
          <p><strong>Skills Required:</strong> ${job.skillsRequired ? job.skillsRequired.join(', ') : 'Not specified'}</p>
          <p><strong>Posted by:</strong> ${job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}` : 'Anonymous'}</p>
          <p><strong>Applicants:</strong> ${job.applicants ? job.applicants.length : 0}</p>
          <button class="apply-btn" onclick="applyToJob('${job._id}')">Apply Now</button>
        </div>
      `).join('');
    } else {
      resultsDiv.innerHTML = '<p>No jobs found matching your criteria.</p>';
    }
  } catch (err) {
    console.error('Search error:', err);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Something went wrong while searching for jobs.</p>';
  }
}

async function applyToJob(jobId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to apply for jobs.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      alert(data.alert || 'Successfully applied to the job!');
      // Refresh the search results to update applicant count
      const lastQuery = getLastSearchQuery();
      if (lastQuery) {
        await searchJobs(lastQuery);
      }
    } else {
      alert(data.alert || data.message || 'Failed to apply to job');
    }
  } catch (err) {
    console.error('Apply error:', err);
    alert('Error applying to job. Please try again.');
  }
}

function getLastSearchQuery() {
  // Get the last search query from form fields
  const skillField = document.getElementById('skill');
  const barangayField = document.getElementById('barangay');
  const minPriceField = document.getElementById('minPrice');
  const maxPriceField = document.getElementById('maxPrice');
  
  if (skillField || barangayField) {
    return {
      skill: skillField?.value || '',
      barangay: barangayField?.value || '',
      minPrice: minPriceField?.value || '',
      maxPrice: maxPriceField?.value || ''
    };
  }
  
  return null;
}

// Export functions for use in other files
window.searchJobs = searchJobs;
window.applyToJob = applyToJob;
