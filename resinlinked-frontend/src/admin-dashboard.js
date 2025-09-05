import apiService from './api.js';

class AdminDashboard {
  constructor() {
    this.currentPage = 1;
    this.limit = 10;
    this.searchQuery = '';
    this.sortField = 'createdAt';
    this.sortOrder = 'desc';
    this.startDate = '';
    this.endDate = '';
    this.init();
  }

  async init() {
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

  // ---------------- EXPORT METHOD ----------------
  async exportFilteredData(type, format = 'pdf') {
    try {
      const filters = {
        search: document.getElementById('userSearch')?.value,
        userType: document.getElementById('userTypeFilter')?.value,
        barangay: document.getElementById('barangayFilter')?.value,
        verified: document.getElementById('verificationFilter')?.value,
        status: document.getElementById('statusFilter')?.value,
        minPrice: document.getElementById('minPriceFilter')?.value,
        maxPrice: document.getElementById('maxPriceFilter')?.value,
        minRating: document.getElementById('minRatingFilter')?.value,
        maxRating: document.getElementById('maxRatingFilter')?.value,
        startDate: document.getElementById('startDateFilter')?.value,
        endDate: document.getElementById('endDateFilter')?.value
      };

      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });

      const filtersQuery = encodeURIComponent(JSON.stringify(filters));
      const url = `http://localhost:5000/api/export/${type}?format=${format}&filters=${filtersQuery}`;

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        let filename = `resilinked-${type}-${new Date().toISOString().split('T')[0]}`;
        if (Object.keys(filters).length > 0) filename += '-filtered';
        filename += `.${format}`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        alert('Error exporting data');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data');
    }
  }
  // ------------------------------------------------

  async loadDashboardData() {
    try {
      const data = await apiService.getDashboardStats();
      this.updateDashboardStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const errEl = document.getElementById('errorMessage');
      if (errEl) errEl.textContent = 'Failed to load dashboard statistics';
    }
  }

  updateDashboardStats(data) {
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('totalUsers', data.totalUsers || 0);
    setText('totalJobs', data.totalJobs || 0);
    setText('totalRatings', data.totalRatings || 0);
    setText('totalReports', data.totalReports || 0);
  }

  async loadAnalyticsData() {
    try {
      const growthFilter = document.getElementById('userGrowthFilter')?.value || 30;
      const growthResponse = await fetch(`http://localhost:5000/api/analytics/user-growth?days=${growthFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (growthResponse.ok) {
        const growthData = await growthResponse.json();
        const el = document.getElementById('userGrowthData');
        if (el) el.textContent = `${growthData.length} data points loaded`;
      }

      const statsFilter = document.getElementById('jobStatsFilter')?.value || 'day';
      const statsResponse = await fetch(`http://localhost:5000/api/analytics/job-stats?by=${statsFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const el = document.getElementById('jobStatsData');
        if (el) el.textContent = `${Object.keys(statsData).length} categories loaded`;
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

      const loadingEl = document.getElementById('usersLoading');
      const containerEl = document.getElementById('usersContainer');

      if (loadingEl) loadingEl.style.display = 'block';
      if (containerEl) containerEl.style.display = 'none';

  const filters = { page, limit, q: search };
  // Unified sorting and date filter
  if (this.sortField) filters.sortBy = this.sortField;
  if (this.sortOrder) filters.order = this.sortOrder;
  if (this.startDate) filters.startDate = this.startDate;
  if (this.endDate) filters.endDate = this.endDate;
  const data = await apiService.getUsers(filters);
  this.renderUsersTable(data.data, data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      const loadingEl = document.getElementById('usersLoading');
      if (loadingEl) loadingEl.textContent = 'Error loading users';
    }
  }

  renderUsersTable(users, pagination) {
    const tbody = document.getElementById('usersTableBody');
    const usersContainer = document.getElementById('usersContainer');
    const usersLoading = document.getElementById('usersLoading');

    if (!tbody || !usersContainer || !usersLoading) return;

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
  // Unified sorting and date filter
  let jobsFilters = { limit: 5 };
  if (this.sortField) jobsFilters.sortBy = this.sortField;
  if (this.sortOrder) jobsFilters.order = this.sortOrder;
  if (this.startDate) jobsFilters.startDate = this.startDate;
  if (this.endDate) jobsFilters.endDate = this.endDate;
  const response = await apiService.getJobs(jobsFilters);
  this.renderRecentJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading recent jobs:', error);
      const jobsLoading = document.getElementById('jobsLoading');
      if (jobsLoading) jobsLoading.textContent = 'Error loading jobs';
    } finally {
      const jobsLoading = document.getElementById('jobsLoading');
      if (jobsLoading) jobsLoading.style.display = 'none';
    }
  }

  renderRecentJobs(jobs) {
    const jobsContainer = document.getElementById('jobsContainer');
    if (!jobsContainer) return;

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
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.viewUser(e.target.dataset.id));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.editUser(e.target.dataset.id));
    });

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

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
          await apiService.deleteUser(e.target.dataset.id);
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

    paginationHTML += `<button class="page-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;

    for (let i = 1; i <= pages; i++) {
      paginationHTML += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    paginationHTML += `<button class="page-btn ${page === pages ? 'disabled' : ''}" ${page === pages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;

    paginationContainer.innerHTML = paginationHTML;

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.loadUsers(page, this.limit, this.searchQuery);
      });
    });
  }

  setupEventListeners() {
    // Unified search, sort, and date filter
    const mainSearchInput = document.getElementById('mainSearch');
    const mainSearchBtn = document.getElementById('mainSearchBtn');
    const mainSortDropdown = document.getElementById('mainSortDropdown');
    const mainStartDate = document.getElementById('mainStartDate');
    const mainEndDate = document.getElementById('mainEndDate');
    if (mainSearchInput && mainSearchBtn) {
      mainSearchBtn.addEventListener('click', () => {
        this.searchQuery = mainSearchInput.value;
        this.loadUsers(1, this.limit, this.searchQuery);
        this.loadRecentJobs();
      });
      mainSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchQuery = mainSearchInput.value;
          this.loadUsers(1, this.limit, this.searchQuery);
          this.loadRecentJobs();
        }
      });
    }
    if (mainSortDropdown) {
      mainSortDropdown.addEventListener('change', (e) => {
        const val = e.target.value;
        const [field, order] = val.split('-');
        this.sortField = field;
        this.sortOrder = order;
        this.loadUsers(1, this.limit, this.searchQuery);
        this.loadRecentJobs();
      });
    }
    if (mainStartDate) {
      mainStartDate.addEventListener('change', (e) => {
        this.startDate = e.target.value;
        this.loadUsers(1, this.limit, this.searchQuery);
        this.loadRecentJobs();
      });
    }
    if (mainEndDate) {
      mainEndDate.addEventListener('change', (e) => {
        this.endDate = e.target.value;
        this.loadUsers(1, this.limit, this.searchQuery);
        this.loadRecentJobs();
      });
    }

    // Filters
    const userTypeFilterEl = document.getElementById('userTypeFilter');
    if (userTypeFilterEl) userTypeFilterEl.addEventListener('change', (e) => {
      this.userTypeFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });

    const verificationFilterEl = document.getElementById('verificationFilter');
    if (verificationFilterEl) verificationFilterEl.addEventListener('change', (e) => {
      this.verificationFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });

    const dateFilterEl = document.getElementById('dateFilter');
    if (dateFilterEl) dateFilterEl.addEventListener('change', (e) => {
      this.dateFilter = e.target.value;
      this.loadUsers(1, this.limit, this.searchQuery);
    });

    // Analytics
    const userGrowthFilterEl = document.getElementById('userGrowthFilter');
    if (userGrowthFilterEl) userGrowthFilterEl.addEventListener('change', () => this.loadAnalyticsData());

    const jobStatsFilterEl = document.getElementById('jobStatsFilter');
    if (jobStatsFilterEl) jobStatsFilterEl.addEventListener('change', () => this.loadAnalyticsData());

    // Exports
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => this.exportFilteredData('users', 'pdf'));

    const exportUsersCsvBtn = document.getElementById('exportUsersCsvBtn');
    if (exportUsersCsvBtn) exportUsersCsvBtn.addEventListener('click', () => this.exportFilteredData('users', 'csv'));

    const exportJobsCsvBtn = document.getElementById('exportJobsCsvBtn');
    if (exportJobsCsvBtn) exportJobsCsvBtn.addEventListener('click', () => this.exportFilteredData('jobs', 'csv'));

    const exportRatingsCsvBtn = document.getElementById('exportRatingsCsvBtn');
    if (exportRatingsCsvBtn) exportRatingsCsvBtn.addEventListener('click', () => this.exportFilteredData('ratings', 'csv'));
  }

  viewUser(userId) {
    window.location.href = `/user-details.html?id=${userId}`;
  }

  editUser(userId) {
    alert(`Edit user ${userId} - This feature would open an edit form`);
  }
}

// Global nav
window.viewDetail = function(type) {
  const routes = {
    users: 'users-management.html',
    jobs: 'jobs-management.html',
    ratings: 'ratings-management.html',
    reports: 'reports-management.html'
  };
  if (routes[type]) window.location.href = routes[type];
};

window.viewJob = function(jobId) {
  window.location.href = `/job-details.html?id=${jobId}`;
};

window.editJob = function(jobId) {
  alert(`Edit job ${jobId} - This would open job edit form`);
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});