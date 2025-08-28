class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
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

    if (config.body && typeof config.body === 'object' && config.headers['Content-Type'] === 'application/json') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }

  async register(userData) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    Object.keys(userData).forEach(key => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        userData[key].forEach(skill => formData.append('skills', skill));
      } else if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    return response.json();
  }

  async verifyEmail(token) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: { token }
    });
  }

  async requestPasswordReset(email) {
    return this.request('/auth/reset/request', {
      method: 'POST',
      body: { email }
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset', {
      method: 'POST',
      body: { token, newPassword }
    });
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/me');
  }

  async updateProfile(updates) {
    return this.request('/users/me', {
      method: 'PUT',
      body: updates
    });
  }

  // Job endpoints
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/jobs?${queryParams}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: jobData
    });
  }

  async applyToJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST'
    });
  }

  async getMyJobMatches() {
    return this.request('/jobs/my-matches');
  }

  // Rating endpoints
  async rateUser(ratingData) {
    return this.request('/ratings', {
      method: 'POST',
      body: ratingData
    });
  }

  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  // Admin endpoints
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/admin/users?${queryParams}`);
  }

  async updateUser(userId, updates) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: updates
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async exportUsersPDF() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/admin/users/download/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return response.blob();
    } else {
      throw new Error('Failed to export PDF');
    }
  }
}

const apiService = new ApiService();
export default apiService;
