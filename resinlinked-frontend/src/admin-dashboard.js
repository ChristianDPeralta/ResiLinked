import apiService from './api.js';

class AdminDashboard {
  constructor() {
    this.currentPage = 1;
    this.limit = 10;
    this.searchQuery = '';
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
    this.setupEventListeners();
  }

  async loadDashboardData() {
    try {
      const data = await apiService.getDashboardStats();
      this.updateDashboardSummary(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  updateDashboardSummary(data) {
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('totalJobs').textContent = data.totalJobs || 0;
    document.getElementById('totalRatings').textContent = data.totalRatings || 0;
    document.getElementById('totalReports').textContent = data.totalReports || 0;
  }

  async loadUsers(page = 1, limit = 10, search = '') {
    try {
      this.currentPage = page;
      this.limit = limit;
      this.searchQuery = search;

      const filters = {
        page,
        limit,
        q: search
      };

      const data = await apiService.getUsers(filters);
      this.renderUsersTable(data.data, data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  renderUsersTable(users, pagination) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
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
          <button class="btn-edit" data-id="${user._id}">Edit</button>
          <button class="btn-toggle-verify" data-id="${user._id}" data-verified="${user.isVerified}">
            ${user.isVerified ? 'Disable' : 'Verify'}
          </button>
          <button class="btn-delete" data-id="${user._id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
    this.setupUserActionListeners();
    this.renderPagination(pagination);
  }

  setupUserActionListeners() {
    // Edit user
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.id;
        this.editUser(userId);
      });
    });
    
    // Toggle verification
    document.querySelectorAll('.btn-toggle-verify').forEach(btn => {
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
    document.querySelectorAll('.btn-delete').forEach(btn => {
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
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.loadUsers(1, this.limit, searchInput.value);
      }, 300));
    }
    
    // PDF export
    const exportBtn = document.getElementById('exportPdf');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          const blob = await apiService.exportUsersPDF();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ResiLinked-Users-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('PDF export error:', error);
          alert('Error generating PDF');
        }
      });
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  editUser(userId) {
    // This would open a modal or navigate to an edit page
    alert(`Edit user ${userId} - This feature would open an edit form`);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});