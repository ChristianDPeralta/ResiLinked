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
    
    // Re-check auth status periodically to catch changes
    setInterval(async () => {
      const currentAuthState = {
        isLoggedIn: this.isLoggedIn,
        userType: this.userType,
        userId: this.userId
      };
      
      await this.checkAuthStatus();
      
      // Re-render navigation if auth state changed
      const newAuthState = {
        isLoggedIn: this.isLoggedIn,
        userType: this.userType,
        userId: this.userId
      };
      
      if (JSON.stringify(currentAuthState) !== JSON.stringify(newAuthState)) {
        console.log('Auth state changed, re-rendering navigation');
        this.renderNavigation();
        this.setupEventListeners();
      }
    }, 30000); // Check every 30 seconds
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
          const responseData = await res.json();
          this.isLoggedIn = true;
          // Use stored userData first, fallback to response data
          this.userType = userData.userType || responseData.user?.userType;
          this.userId = userData.userId || responseData.user?.id || responseData.user?._id;
          
          // Update localStorage with fresh data if available
          if (responseData.user) {
            const updatedUserData = {
              userId: this.userId,
              userType: this.userType,
              isVerified: userData.isVerified || responseData.user.isVerified
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        } else {
          console.log('Token verification failed, clearing auth data');
          this.clearAuthData();
        }
      } else {
        console.log('No token or userData found');
        this.clearAuthData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear auth data on network errors, just log them
      console.log('Network error during auth check, maintaining current state');
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
    if (!navElement) {
      console.warn('Navigation element #main-nav not found');
      return;
    }

    // Get current page for active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Debug logging
    console.log('Navigation Debug:', {
      isLoggedIn: this.isLoggedIn,
      userType: this.userType,
      userId: this.userId,
      currentPage: currentPage
    });

    let navHTML = '';
    
    if (this.isLoggedIn) {
      // Common links for all logged-in users
      navHTML = `
        <a href="search-jobs.html" ${currentPage === 'search-jobs.html' ? 'class="active"' : ''}>Find Jobs</a>
        <a href="profile.html" ${currentPage === 'profile.html' ? 'class="active"' : ''}>Profile</a>
        <a href="settings.html" ${currentPage === 'settings.html' ? 'class="active"' : ''}>Settings</a>
      `;
      
      // Role-specific links - be more specific about conditions
      if (this.userType === 'employee') {
        console.log('Adding employee-only dashboard link');
        navHTML += `<a href="employee-dashboard.html" ${currentPage === 'employee-dashboard.html' ? 'class="active"' : ''}>Employee Dashboard</a>`;
        navHTML += `<a href="post-profile.html" ${currentPage === 'post-profile.html' ? 'class="active"' : ''}>Post Profile</a>`;
      } else if (this.userType === 'employer') {
        console.log('Adding employer-only dashboard link');
        navHTML += `<a href="employer-dashboard.html" ${currentPage === 'employer-dashboard.html' ? 'class="active"' : ''}>Employer Dashboard</a>`;
        navHTML += `<a href="post-job.html" ${currentPage === 'post-job.html' ? 'class="active"' : ''}>Post Job</a>`;
      } else if (this.userType === 'both') {
        console.log('Adding both employee and employer dashboard links');
        navHTML += `<a href="employee-dashboard.html" ${currentPage === 'employee-dashboard.html' ? 'class="active"' : ''}>Employee Dashboard</a>`;
        navHTML += `<a href="employer-dashboard.html" ${currentPage === 'employer-dashboard.html' ? 'class="active"' : ''}>Employer Dashboard</a>`;
        navHTML += `<a href="post-profile.html" ${currentPage === 'post-profile.html' ? 'class="active"' : ''}>Post Profile</a>`;
        navHTML += `<a href="post-job.html" ${currentPage === 'post-job.html' ? 'class="active"' : ''}>Post Job</a>`;
      }
      
      if (this.userType === 'admin') {
        console.log('Adding admin dashboard link');
        navHTML += `<a href="admin-dashboard.html" ${currentPage === 'admin-dashboard.html' ? 'class="active"' : ''}>Admin Dashboard</a>`;
      }
      
      // Logout button
      navHTML += `<a href="#" id="logoutBtn">Logout</a>`;
    } else {
      console.log('User not logged in, showing guest navigation');
      // Links for non-logged-in users
      navHTML = `
        <a href="search-jobs.html" ${currentPage === 'search-jobs.html' ? 'class="active"' : ''}>Find Jobs</a>
        <a href="login.html" ${currentPage === 'login.html' ? 'class="active"' : ''}>Login</a>
        <a href="register.html" ${currentPage === 'register.html' ? 'class="active"' : ''}>Register</a>
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
    // Force a navigation refresh
    this.renderNavigation();
    window.location.href = '/landing.html';
  }

  // Method to manually refresh navigation (for other components to call)
  async refreshNavigation() {
    await this.checkAuthStatus();
    this.renderNavigation();
    this.setupEventListeners();
  }

  // Get authentication status for other components
  getAuthStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      userType: this.userType,
      userId: this.userId
    };
  }

  // Check if user has access to a specific dashboard
  hasAccessTo(dashboardType) {
    if (!this.isLoggedIn) return false;
    
    switch (dashboardType) {
      case 'employee':
        return this.userType === 'employee' || this.userType === 'both';
      case 'employer':
        return this.userType === 'employer' || this.userType === 'both';
      case 'admin':
        return this.userType === 'admin';
      default:
        return false;
    }
  }

  // Method to handle dashboard access validation
  validateDashboardAccess(requiredType) {
    if (!this.hasAccessTo(requiredType)) {
      alert(`Access denied. This page is for ${requiredType}s only.`);
      window.location.href = '/landing.html';
      return false;
    }
    return true;
  }

  // Debug function to check auth status
  debugAuth() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const token = localStorage.getItem('token');
    
    console.log('=== AUTH DEBUG ===');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('User Data:', userData);
    console.log('Navigation State:', {
      isLoggedIn: this.isLoggedIn,
      userType: this.userType,
      userId: this.userId
    });
    console.log('=================');
    
    return {
      token: !!token,
      userData,
      navState: this.getAuthStatus()
    };
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigation = new Navigation();
  
  // Make debug function globally accessible
  window.debugAuth = () => {
    if (window.navigation) {
      return window.navigation.debugAuth();
    } else {
      console.error('Navigation not initialized');
      return null;
    }
  };
  
  // Also log initial state
  setTimeout(() => {
    console.log('Navigation initialized. Run debugAuth() in console to check auth status.');
  }, 1000);
});