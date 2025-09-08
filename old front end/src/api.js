class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.DEBUG = true; // Set this to true to enable debug logging
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    if (
      config.body &&
      typeof config.body === 'object' &&
      config.headers['Content-Type'] === 'application/json'
    ) {
      config.body = JSON.stringify(config.body);
    }

    try {
      if (this.DEBUG) {
        console.log(`Making API request to: ${this.baseURL}${endpoint}`);
        console.log('Request config:', config);
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (this.DEBUG) {
        console.log('API response:', response.status, data);
      }

      if (!response.ok) {
        // For all error responses, preserve the full response data and status
        if (this.DEBUG) {
          console.warn(`HTTP error ${response.status} received:`, data);
        }
        
        // Create an error object that includes the response
        const error = new Error(data.message || data.alert || `HTTP error! status: ${response.status}`);
        error.response = { 
          status: response.status, 
          data: data,
          statusText: response.statusText
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (this.DEBUG) console.error('API request failed:', error);
      throw error;
    }
  }

  // ================= Auth =================
  async login(credentials) {
    try {
      if (this.DEBUG) {
        console.log('Login attempt with credentials:', { email: credentials.email, hasPassword: !!credentials.password });
      }
      
      // Make a direct fetch call for login to ensure proper error handling
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (this.DEBUG) {
        console.log('Login response:', response.status, data);
      }
      
      if (!response.ok) {
        // Create a custom error with the response data
        const error = new Error(data.message || data.alert || `Login failed: ${response.status}`);
        error.response = {
          status: response.status,
          data: data,
          statusText: response.statusText
        };
        throw error;
      }
      
      return data;
    } catch (error) {
      if (this.DEBUG) console.error('Login error details:', error);
      throw error; // Re-throw to be handled by the login component
    }
  }

  async register(userData) {
    const token = localStorage.getItem('token');
    const formData = new FormData();

    Object.keys(userData).forEach((key) => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        userData[key].forEach((skill) => formData.append('skills', skill));
      } else if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  }

  async verifyEmail(token) {
    console.log('API verifyEmail - token:', token);
    
    // Directly use fetch to bypass any default headers/configs that might cause issues
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('API verifyEmail - response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.message || data.alert || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }
  
  async resendVerificationEmail(email) {
    return this.request('/auth/verify/resend', {
      method: 'POST',
      body: { email }
    });
  }

  async requestPasswordReset(email) {
    return this.request('/auth/reset/request', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset', {
      method: 'POST',
      body: { token, newPassword },
    });
  }

  // ================= User =================
  async getProfile() {
    return this.request('/users/me');
  }

  async updateProfile(updates) {
    return this.request('/users/me', {
      method: 'PUT',
      body: updates,
    });
  }

  async updateProfileWithFile(formData) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseURL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header for FormData - browser will set it with boundary
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // ================= Jobs =================
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/jobs?${queryParams}`;
    console.log('API getJobs - URL:', url);
    console.log('API getJobs - Filters:', filters);
    return this.request(url);
  }

  async searchJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/jobs/search?${queryParams}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: jobData,
    });
  }

  async applyToJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST',
    });
  }

  async getMyJobMatches() {
    return this.request('/jobs/my-matches');
  }

  async getMyApplications() {
    return this.request('/jobs/my-applications');
  }

  async assignWorker(jobId, userId) {
    return this.request(`/jobs/${jobId}/assign`, {
      method: 'POST',
      body: { userId }
    });
  }

  async getPopularJobs() {
    return this.request('/jobs/popular');
  }

  // ================= Ratings =================
  async rateUser(ratingData) {
    return this.request('/ratings', {
      method: 'POST',
      body: ratingData,
    });
  }

  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  // ================= Admin =================
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/admin/users?${queryParams}`);
  }

  async getUser(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  async updateUser(userId, updates) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAdminJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    console.log('Calling admin jobs endpoint with params:', queryParams);
    try {
      const response = await this.request(`/admin/jobs?${queryParams}`);
      console.log('Admin jobs response:', response);
      return response;
    } catch (error) {
      console.error('Admin jobs API error:', error);
      throw error;
    }
  }

  async updateJob(jobId, updates) {
    return this.request(`/admin/jobs/${jobId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteJob(jobId) {
    return this.request(`/admin/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  async exportUsersPDF() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/admin/users/download/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return response.blob();
    } else {
      throw new Error('Failed to export PDF');
    }
  }

  // ================= Employees =================
  async getEmployeeStats(userId) {
    return this.request(`/employees/${userId}/stats`);
  }

  async getEmployeeApplications(userId) {
    return this.request(`/employees/${userId}/applications`);
  }

  async getEmployeeProfile(userId) {
    return this.request(`/employees/${userId}/profile`);
  }

  async updateEmployeeProfile(userId, profileData) {
    return this.request(`/employees/${userId}/profile`, {
      method: 'PUT',
      body: profileData,
    });
  }

  async searchEmployees(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/employees/search?${queryParams}`);
  }

  async sendJobRequest(employeeId, jobData) {
    return this.request(`/employees/${employeeId}/job-request`, {
      method: 'POST',
      body: jobData,
    });
  }

  async getJobRequests(userId) {
    return this.request(`/users/${userId}/job-requests`);
  }

  async respondToJobRequest(requestId, response) {
    return this.request(`/job-requests/${requestId}/respond`, {
      method: 'POST',
      body: { response },
    });
  }

  // ================= Goals =================
  async getMyGoals(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/goals?${queryParams}`);
  }

  async createGoal(goalData) {
    return this.request('/goals', {
      method: 'POST',
      body: goalData,
    });
  }

  async updateGoal(goalId, updates) {
    return this.request(`/goals/${goalId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteGoal(goalId) {
    return this.request(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  }
  
  // ================= Notifications =================
  async getNotifications(filters = {}) {
    // Add a timestamp to prevent browser caching
    const updatedFilters = { 
      ...filters, 
      _t: Date.now() 
    };
    const queryParams = new URLSearchParams(updatedFilters).toString();
    return this.request(`/notifications?${queryParams}`);
  }
  
  async markNotificationAsRead(notificationId) {
    if (this.DEBUG) console.log('Marking notification as read:', notificationId);
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      body: {} // Ensure we're sending an empty body object
    });
  }
  
  async markAllNotificationsAsRead() {
    if (this.DEBUG) console.log('Marking all notifications as read');
    return this.request(`/notifications/all/read`, {
      method: 'PATCH',
      body: { all: true }
    });
  }
  
  async markNotificationAsSeen(notificationId) {
    if (this.DEBUG) console.log('Marking notification as seen:', notificationId);
    return this.request(`/notifications/${notificationId}/seen`, {
      method: 'PATCH',
      body: {} 
    });
  }
  
  async markAllNotificationsAsSeen() {
    if (this.DEBUG) console.log('Marking all notifications as seen');
    return this.request(`/notifications/all/seen`, {
      method: 'PATCH',
      body: { all: true }
    });
  }
  
  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
}

// ✅ Only one instance exported
const apiService = new ApiService();

// Create a simple apiCall function for backward compatibility
export const apiCall = async (endpoint, method = 'GET', data = null) => {
  const options = { method };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = data;
  }
  
  return await apiService.request(endpoint, options);
};

export default apiService;
