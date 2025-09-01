import apiService from './api.js';

class AdminDashboard {
  constructor() {
    this.currentPage = 1;
    this.limit = 10;
    this.searchQuery = '';
    this.userTypeFilter = '';
    this.verificationFilter = '';
    this.dateFilter = '';
    this.init();
  }

  async init() {
    // Check if user is admin
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.userType !== 'admin') {
      alert('Admin access required');
      window.location.href = '/landing.html';
      return;
    }

    await this.loadDashboardData();
    await this.loadUsers();
    await this.loadRecentJobs();
    await this.loadAnalyticsData();
    this.setupEventListeners();
  }

  async loadDashboardData() {
    try {
      const data = await apiService.getDashboardStats();
      this.updateDashboardStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      document.getElementById('errorMessage').textContent = 'Failed to load dashboard statistics';
    }
  }

  updateDashboardStats(data) {
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('totalJobs').textContent = data.totalJobs || 0;
    document.getElementById('totalRatings').textContent = data.totalRatings || 0;
    document.getElementById('totalReports').textContent = data.totalReports || 0;
  }

  async loadAnalyticsData() {
    try {
      // Load user growth data
      const growthFilter = document.getElementById('userGrowthFilter').value;
      const growthResponse = await fetch(`http://localhost:5000/api/analytics/user-growth?days=${growthFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (growthResponse.ok) {
        const growthData = await growthResponse.json();
        document.getElementById('userGrowthData').textContent = 
          `${growthData.length} data points loaded`;
      }
      
      // Load job statistics
      const statsFilter = document.getElementById('jobStatsFilter').value;
      const statsResponse = await fetch(`http://localhost:5000/api/analytics/job-stats?by=${statsFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        document.getElementById('jobStatsData').textContent = 
          `${Object.keys(statsData).length} categories loaded`;
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }

  async loadUsers(page = 1, limit = 10, search = '') {
    try {
      this.currentPage = page;
      this.limit = limit;
      this.searchQuery = search;

      document.getElementById('usersLoading').style.display = 'block';
      document.getElementById('usersContainer').style.display = 'none';

      const filters = {
        page,
        limit,
        q: search,
        userType: this.userTypeFilter,
        verified: this.verificationFilter,
        days: this.dateFilter
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === '') delete filters[key];
      });

      const data = await apiService.getUsers(filters);
      this.renderUsersTable(data.data, data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      document.getElementById('usersLoading').textContent = 'Error loading users';
    }
  }

  renderUsersTable(users, pagination) {
    const tbody = document.getElementById('usersTableBody');
    const usersContainer = document.getElementById('usersContainer');
    const usersLoading = document.getElementById('usersLoading');
    
    if (!users || users.length === 0) {
      usersLoading.textContent = 'No users found';
      usersContainer.style.display = 'none';
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.userType}</td>
        <td>${user.barangay || 'N/A'}</td>
        <td>${user.isVerified ? 'Verified' : 'Unverified'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td class="actions">
          <button class="action-btn view-btn" data-id="${user._id}">View</button>
          <button class="action-btn edit-btn" data-id="${user._id}">Edit</button>
          <button class="action-btn toggle-btn" data-id="${user._id}" data-verified="${user.isVerified}">
            ${user.isVerified ? 'Disable' : 'Verify'}
          </button>
          <button class="action-btn delete-btn" data-id="${user._id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
    this.renderPagination(pagination);
    this.setupUserActionListeners();
    
    usersLoading.style.display = 'none';
    usersContainer.style.display = 'block';
  }

  async loadRecentJobs() {
    try {
      const response = await apiService.getJobs({ limit: 5, sortBy: 'datePosted', order: 'desc' });
      this.renderRecentJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading recent jobs:', error);
      document.getElementById('jobsLoading').textContent = 'Error loading jobs';
    } finally {
      document.getElementById('jobsLoading').style.display = 'none';
    }
  }

  renderRecentJobs(jobs) {
    const jobsContainer = document.getElementById('jobsContainer');
    
    if (!jobs || jobs.length === 0) {
      jobsContainer.innerHTML = '<div class="no-data">No jobs found</div>';
      return;
    }
    
    jobsContainer.innerHTML = jobs.map(job => `
      <div class="job-card" style="margin-bottom: 15px; padding: 15px;">
        <h3 style="margin: 0 0 10px 0; color: var(--header-bg);">${job.title}</h3>
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div>₱${job.price} • ${job.barangay}</div>
          <div>${job.applicants ? job.applicants.length : 0} applicants</div>
        </div>
        <div style="margin-top: 10px;">
          <button class="action-btn view-btn" onclick="viewJob('${job._id}')">View Job</button>
          <button class="action-btn edit-btn" onclick="editJob('${job._id}')">Edit</button>
        </div>
      </div>
    `).join('');
  }

  setupUserActionListeners() {
    // View user
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.id;
        this.viewUser(userId);
      });
    });
    
    // Edit user
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.id;
        this.editUser(userId);
      });
    });
    
    // Toggle verification
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.target.dataset.id;
        const isVerified = e.target.dataset.verified === 'true';
        
        try {
          await apiService.updateUser(userId, { isVerified: !isVerified });
          alert(`User ${!isVerified ? 'verified' : 'disabled'} successfully`);
          this.loadUsers(this.currentPage, this.limit, this.searchQuery);
        } catch (error) {
          console.error('Toggle verify error:', error);
          alert('Error updating user');
        }
      });
    });
    
    // Delete user
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        const userId = e.target.dataset.id;
        try {
          await apiService.deleteUser(userId);
          alert('User deleted successfully');
          this.loadUsers(this.currentPage, this.limit, this.searchQuery);
        } catch (error) {
          console.error('Delete user error:', error);
          alert('Error deleting user');
        }
      });
    });
  }

  renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer || !pagination) return;
    
    const { page, pages } = pagination;
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button class="page-btn ${page === 1 ? 'disabled' : ''}" 
      ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= pages; i++) {
      paginationHTML += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    // Next button
    paginationHTML += `<button class="page-btn ${page === pages ? 'disabled' : ''}" 
      ${page === pages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to page buttons
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.loadUsers(page, this.limit, this.searchQuery);
      });
    });
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('userSearch');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => {
      this.loadUsers(1, this.limit, searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadUsers(1, this.limit, searchInput.value);
      }
    });
    
    // Filter functionality
    document.getElementById('userTypeFilter').addEventListener('change', (e) => {
      this.userTypeFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });
    
    document.getElementById('verificationFilter').addEventListener('change', (e) => {
      this.verificationFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });
    
    document.getElementById('dateFilter').addEventListener('change', (e) => {
      this.dateFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });
    
    // Analytics filter functionality
    document.getElementById('userGrowthFilter').addEventListener('change', () => {
      this.loadAnalyticsData();
    });
    
    document.getElementById('jobStatsFilter').addEventListener('change', () => {
      this.loadAnalyticsData();
    });
    
    // PDF export
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    exportPdfBtn.addEventListener('click', async () => {
      try {
        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i>⏳</i> Generating PDF...';
        
        const blob = await apiService.exportUsersPDF();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ResiLinked-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('PDF export error:', error);
        alert('Error generating PDF');
      } finally {
        exportPdfBtn.disabled = false;
        exportPdfBtn.innerHTML = '<i>📄</i> Export PDF Report';
      }
    });
  }

  viewUser(userId) {
    window.location.href = `/user-details.html?id=${userId}`;
  }

  editUser(userId) {
    // This would open a modal or navigate to an edit page
    alert(`Edit user ${userId} - This feature would open an edit form`);
  }
}

// Global functions for navigation
window.viewDetail = function(type) {
  switch(type) {
    case 'users':
      window.location.href = 'users-management.html';
      break;
    case 'jobs':
      window.location.href = 'jobs-management.html';
      break;
    case 'ratings':
      window.location.href = 'ratings-management.html';
      break;
    case 'reports':
      window.location.href = 'reports-management.html';
      break;
  }
};

window.viewJob = function(jobId) {
  window.location.href = `/job-details.html?id=${jobId}`;
};

window.editJob = function(jobId) {
  alert(`Edit job ${jobId} - This would open job edit form`);
};

window.exportData = async function(type) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/admin/export/${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ResiLinked-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert('Error exporting data');
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Error exporting data');
  }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});