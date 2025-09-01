class Navigation {
  constructor() {
    this.isLoggedIn = false;
    this.userType = null;
    this.userId = null;
    this.init();
  }

  async init() {
    await this.checkAuthStatus();
    this.renderNavigation();
    this.setupEventListeners();
  }

  async checkAuthStatus() {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (token && userData.userId) {
        // Verify token is still valid
        const res = await fetch('http://localhost:5000/api/auth/verify', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          this.isLoggedIn = true;
          this.userType = userData.userType;
          this.userId = userData.userId;
        } else {
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.clearAuthData();
    }
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.isLoggedIn = false;
    this.userType = null;
    this.userId = null;
  }

  renderNavigation() {
    const navElement = document.getElementById('main-nav');
    if (!navElement) return;

    let navHTML = '';
    
    if (this.isLoggedIn) {
      // Common links for all logged-in users
      navHTML = `
        <a href="profile.html">Profile</a>
        <a href="search-jobs.html">Find Jobs</a>
        <a href="settings.html">Settings</a>
      `;
      
      // Role-specific links
      if (this.userType === 'employee' || this.userType === 'both') {
        navHTML += `<a href="employee-dashboard.html">Employee Dashboard</a>`;
        navHTML += `<a href="post-profile.html">Post Profile</a>`;
      }
      
      if (this.userType === 'employer' || this.userType === 'both') {
        navHTML += `<a href="employer-dashboard.html">Employer Dashboard</a>`;
        navHTML += `<a href="post-job.html">Post Job</a>`;
      }
      
      if (this.userType === 'admin') {
        navHTML += `<a href="admin-dashboard.html">Admin Dashboard</a>`;
      }
      
      // Logout button
      navHTML += `<a href="#" id="logoutBtn">Logout</a>`;
    } else {
      // Links for non-logged-in users
      navHTML = `
        <a href="search-jobs.html">Find Jobs</a>
        <a href="login.html">Login</a>
        <a href="register.html">Register</a>
      `;
    }
    
    navElement.innerHTML = navHTML;
  }

  setupEventListeners() {
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Update UI based on login status for other elements
    this.updateUIForAuthStatus();
  }

  updateUIForAuthStatus() {
    // Enable/disable job application buttons
    const applyButtons = document.querySelectorAll('.apply-btn, .apply-job-btn');
    applyButtons.forEach(btn => {
      if (!this.isLoggedIn) {
        btn.disabled = true;
        btn.title = "Please login to apply";
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Please login to apply for jobs');
          window.location.href = '/login.html';
        });
      } else {
        btn.disabled = false;
        btn.title = "Apply for this job";
      }
    });

    // Show/hide elements based on auth status
    const authOnlyElements = document.querySelectorAll('.auth-only');
    const nonAuthElements = document.querySelectorAll('.non-auth-only');
    
    authOnlyElements.forEach(el => {
      el.style.display = this.isLoggedIn ? 'block' : 'none';
    });
    
    nonAuthElements.forEach(el => {
      el.style.display = this.isLoggedIn ? 'none' : 'block';
    });

    // Show/hide role-specific elements
    const employeeElements = document.querySelectorAll('.employee-only');
    const employerElements = document.querySelectorAll('.employer-only');
    
    employeeElements.forEach(el => {
      el.style.display = (this.isLoggedIn && (this.userType === 'employee' || this.userType === 'both')) ? 'block' : 'none';
    });
    
    employerElements.forEach(el => {
      el.style.display = (this.isLoggedIn && (this.userType === 'employer' || this.userType === 'both')) ? 'block' : 'none';
    });
  }

  logout() {
    this.clearAuthData();
    window.location.href = '/index.html';
  }

  // Get authentication status for other components
  getAuthStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      userType: this.userType,
      userId: this.userId
    };
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigation = new Navigation();
});