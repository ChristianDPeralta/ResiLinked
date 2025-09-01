import apiService from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is admin
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.userType !== 'admin') {
    alert('Admin access required');
    window.location.href = '/landing.html';
    return;
  }

  // Get user ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  
  if (!userId) {
    alert('No user specified');
    window.location.href = '/admin-dashboard.html';
    return;
  }
  
  // Load user details
  await loadUserDetails(userId);
  
  // Set up tab navigation
  setupTabNavigation();
});

async function loadUserDetails(userId) {
  try {
    const user = await apiService.getProfile(userId);
    renderUserDetails(user);
    
    // Load additional data
    await loadUserActivity(userId);
    await loadUserJobs(userId);
    await loadUserRatings(userId);
  } catch (error) {
    console.error('Error loading user details:', error);
    document.getElementById('errorMessage').textContent = 'Failed to load user details';
  }
}

function renderUserDetails(user) {
  if (!user) {
    document.getElementById('errorMessage').textContent = 'User not found';
    return;
  }
  
  // Update user header
  document.getElementById('userName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
  document.getElementById('userEmail').textContent = user.email || 'N/A';
  document.getElementById('userPhone').textContent = user.mobileNo || 'Not provided';
  document.getElementById('userLocation').textContent = `${user.barangay || 'Unknown location'}, ${user.address || ''}`;
  
  // Update verification badge
  const verificationBadge = document.getElementById('verificationBadge');
  if (user.isVerified) {
    verificationBadge.innerHTML = '<span class="verification-badge">Verified</span>';
  } else {
    verificationBadge.innerHTML = '<span class="verification-badge" style="background: #e53e3e;">Unverified</span>';
  }
  
  // Update basic information
  document.getElementById('userType').textContent = user.userType || 'Not specified';
  document.getElementById('regDate').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
  document.getElementById('lastLogin').textContent = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
  document.getElementById('userStatus').textContent = user.isActive !== false ? 'Active' : 'Inactive';
  
  // Update skills
  const skillsContainer = document.getElementById('skillsContainer');
  skillsContainer.innerHTML = '';
  if (Array.isArray(user.skills) && user.skills.length > 0) {
    skillsContainer.innerHTML = `
      <div class="skills-list">
        ${user.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
    `;
  } else {
    skillsContainer.innerHTML = `<div class="no-data">No skills information available</div>`;
  }
  
  // Set avatar background color based on name
  const avatar = document.getElementById('userAvatar');
  const colors = ['#e1eed9', '#f0e6ff', '#ffe6e6', '#e6f7ff'];
  const colorIndex = (user.firstName ? user.firstName.length : 0) % colors.length;
  avatar.style.backgroundColor = colors[colorIndex];
  avatar.innerHTML = '<i style="font-size: 2.5rem;">👤</i>';
  
  // Show user content
  document.getElementById('userLoading').style.display = 'none';
  document.getElementById('userContent').style.display = 'block';
}

async function loadUserActivity(userId) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/activity`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const activity = await response.json();
      renderUserActivity(activity);
    }
  } catch (error) {
    console.error('Error loading user activity:', error);
  }
}

function renderUserActivity(activity) {
  const activityContainer = document.getElementById('recentActivity');
  const activityLog = document.getElementById('activityLog');
  
  if (!Array.isArray(activity) || activity.length === 0) {
    return; // Keep the "no activity" message
  }
  
  const recentActivity = activity.slice(0, 5);
  const activityItems = recentActivity.map(item => `
    <div class="activity-item">
      <div class="activity-icon">${getActivityIcon(item.type)}</div>
      <div class="activity-content">
        <div class="activity-title">${item.description || 'No description'}</div>
        <div class="activity-date">${item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</div>
      </div>
    </div>
  `).join('');
  
  activityContainer.innerHTML = `<div class="activity-list">${activityItems}</div>`;
  
  // Full activity log
  const fullActivityItems = activity.map(item => `
    <div class="activity-item">
      <div class="activity-icon">${getActivityIcon(item.type)}</div>
      <div class="activity-content">
        <div class="activity-title">${item.description || 'No description'}</div>
        <div class="activity-date">${item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</div>
      </div>
    </div>
  `).join('');
  
  activityLog.innerHTML = `<div class="activity-list">${fullActivityItems}</div>`;
}

async function loadUserJobs(userId) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/jobs`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const jobs = await response.json();
      renderUserJobs(jobs);
    }
  } catch (error) {
    console.error('Error loading user jobs:', error);
  }
}

function renderUserJobs(jobs) {
  const jobHistory = document.getElementById('jobHistory');
  
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return; // Keep the "no job history" message
  }
  
  const jobItems = jobs.map(job => `
    <div class="activity-item">
      <div class="activity-icon">💼</div>
      <div class="activity-content">
        <div class="activity-title">${job.title || 'Untitled'} - ₱${job.price || 0}</div>
        <div class="activity-date">${job.barangay || 'Unknown'} • ${job.datePosted ? new Date(job.datePosted).toLocaleDateString() : ''}</div>
        <div>Status: ${job.status || 'N/A'} • Applicants: ${Array.isArray(job.applicants) ? job.applicants.length : 0}</div>
      </div>
    </div>
  `).join('');
  
  jobHistory.innerHTML = `<div class="activity-list">${jobItems}</div>`;
}

async function loadUserRatings(userId) {
  try {
    const ratings = await apiService.getUserRatings(userId);
    renderUserRatings(ratings);
  } catch (error) {
    console.error('Error loading user ratings:', error);
  }
}

function renderUserRatings(ratings) {
  const userRatings = document.getElementById('userRatings');
  
  if (!ratings || !Array.isArray(ratings.ratings) || ratings.ratings.length === 0) {
    return; // Keep the "no ratings" message
  }
  
  const ratingItems = ratings.ratings.map(rating => `
    <div class="activity-item">
      <div class="activity-icon">${'★'.repeat(rating.rating || 0)}</div>
      <div class="activity-content">
        <div class="activity-title">Rated by ${rating.rater?.firstName || 'Anonymous'} ${rating.rater?.lastName || ''}</div>
        <div class="activity-date">${rating.createdAt ? new Date(rating.createdAt).toLocaleDateString() : ''}</div>
        <div>${rating.comment || 'No comment provided'}</div>
      </div>
    </div>
  `).join('');
  
  userRatings.innerHTML = `
    <div class="activity-list">${ratingItems}</div>
    <div style="margin-top: 20px; padding: 15px; background: #f0fff4; border-radius: var(--radius);">
      <div style="font-weight: 600; margin-bottom: 10px;">Rating Summary</div>
      <div>Average Rating: <strong>${ratings.averageRating ? ratings.averageRating.toFixed(1) : 'N/A'}/5</strong></div>
      <div>Total Ratings: <strong>${ratings.ratings.length}</strong></div>
    </div>
  `;
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`${tabId}Tab`).classList.add('active');
    });
  });
}

function getActivityIcon(activityType) {
  const icons = {
    'login': '🔐',
    'job_post': '💼',
    'job_apply': '📝',
    'rating': '⭐',
    'profile_update': '✏️',
    'registration': '👤'
  };
  
  return icons[activityType] || '📋';
}

// Global functions for action buttons
window.sendMessage = function() {
  alert('Send message functionality would open a message dialog');
};

window.editUser = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  alert(`Edit user ${userId} functionality would open an edit form`);
};

window.deleteUser = async function() {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    await apiService.deleteUser(userId);
    alert('User deleted successfully');
    window.location.href = '/admin-dashboard.html';
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user');
  }
};
