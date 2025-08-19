<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ResiLinked Dashboard</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="dashboard">
  <div class="dashboard-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="logo">
        <h1>ResiLinked</h1>
      </div>
      
      <nav class="nav-menu">
        <ul>
          <li class="active" data-section="dashboard"><i class="fas fa-home"></i> Dashboard</li>
          <li data-section="jobs"><i class="fas fa-briefcase"></i> Jobs</li>
          <li data-section="profile"><i class="fas fa-user"></i> Profile</li>
          <li data-section="notifications"><i class="fas fa-bell"></i> Notifications</li>
          <li data-section="goals" class="employee-only"><i class="fas fa-bullseye"></i> Goals</li>
          <li data-section="reports" class="admin-only"><i class="fas fa-flag"></i> Reports</li>
          <li data-section="admin" class="admin-only"><i class="fas fa-cog"></i> Admin</li>
        </ul>
      </nav>
      
      <div class="user-profile">
        <img id="user-avatar" src="" alt="Profile Picture">
        <div>
          <h3 id="user-name">Loading...</h3>
          <p id="user-type"></p>
          <button id="logout-btn">Logout</button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Dashboard Section -->
      <section id="dashboard-section" class="content-section active">
        <h2>Dashboard Overview</h2>
        
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Job Matches</h3>
            <p id="job-matches-count">0</p>
          </div>
          <div class="stat-card">
            <h3>Applications</h3>
            <p id="applications-count">0</p>
          </div>
          <div class="stat-card">
            <h3>Ratings</h3>
            <p id="ratings-count">0</p>
          </div>
          <div class="stat-card">
            <h3>Barangay</h3>
            <p id="user-barangay">Loading...</p>
          </div>
        </div>
        
        <!-- Recent Jobs (For Employees) -->
        <div class="employee-only">
          <div class="section-header">
            <h3>Recommended Jobs</h3>
            <button id="refresh-jobs">Refresh</button>
          </div>
          <div id="job-matches" class="cards-container"></div>
        </div>
        
        <!-- Posted Jobs (For Employers) -->
        <div class="employer-only">
          <div class="section-header">
            <h3>Your Posted Jobs</h3>
            <button id="post-job-btn">Post New Job</button>
          </div>
          <div id="posted-jobs" class="cards-container"></div>
        </div>
        
        <!-- Admin Dashboard -->
        <div class="admin-only">
          <div class="section-header">
            <h3>System Overview</h3>
          </div>
          <div class="admin-stats-grid">
            <div class="stat-card">
              <h3>Total Users</h3>
              <p id="total-users">0</p>
            </div>
            <div class="stat-card">
              <h3>Total Jobs</h3>
              <p id="total-jobs">0</p>
            </div>
            <div class="stat-card">
              <h3>Pending Reports</h3>
              <p id="pending-reports">0</p>
            </div>
          </div>
          
          <h3>Recent Activity</h3>
          <div id="admin-activity" class="activity-feed"></div>
        </div>
      </section>
      
      <!-- Jobs Section -->
      <section id="jobs-section" class="content-section">
        <div class="section-header">
          <h2>Job Marketplace</h2>
          <div class="search-filter">
            <input type="text" id="job-search" placeholder="Search jobs...">
            <select id="job-filter">
              <option value="all">All Jobs</option>
              <option value="my-barangay">My Barangay</option>
              <option value="my-skills">My Skills</option>
            </select>
          </div>
        </div>
        
        <div id="job-marketplace" class="cards-container"></div>
        
        <!-- Job Posting Modal -->
        <div id="job-modal" class="modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Post New Job</h3>
            <form id="job-form">
              <input type="text" id="job-title" placeholder="Job Title" required>
              <textarea id="job-description" placeholder="Job Description" required></textarea>
              <input type="number" id="job-price" placeholder="Price" required>
              <input type="text" id="job-skills" placeholder="Required Skills (comma separated)">
              <select id="job-barangay" required>
                <option value="">Select Barangay</option>
                <!-- Barangay options will be populated from JS -->
              </select>
              <button type="submit">Post Job</button>
            </form>
          </div>
        </div>
      </section>
      
      <!-- Profile Section -->
      <section id="profile-section" class="content-section">
        <h2>Your Profile</h2>
        
        <div class="profile-container">
          <div class="profile-info">
            <div class="avatar-container">
              <img id="profile-avatar" src="" alt="Profile Picture">
              <input type="file" id="avatar-upload" accept="image/*">
              <label for="avatar-upload" class="upload-btn">Change Photo</label>
            </div>
            
            <form id="profile-form">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" id="first-name" required>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="last-name" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="email" required>
              </div>
              <div class="form-group">
                <label>Mobile Number</label>
                <input type="tel" id="mobile-no" required>
              </div>
              <div class="form-group">
                <label>Barangay</label>
                <select id="barangay" required>
                  <!-- Barangay options will be populated from JS -->
                </select>
              </div>
              <div class="form-group">
                <label>Skills</label>
                <input type="text" id="skills" placeholder="Add your skills (comma separated)">
              </div>
              <button type="submit" class="save-btn">Save Changes</button>
            </form>
          </div>
          
          <div class="verification-status">
            <h3>Verification Status</h3>
            <div id="verification-card" class="status-card">
              <!-- Verification status will be populated from JS -->
            </div>
            
            <h3>Change Password</h3>
            <form id="password-form">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="current-password" required>
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" id="new-password" required>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" id="confirm-password" required>
              </div>
              <button type="submit" class="change-password-btn">Change Password</button>
            </form>
          </div>
        </div>
      </section>
      
      <!-- Notifications Section -->
      <section id="notifications-section" class="content-section">
        <div class="section-header">
          <h2>Notifications</h2>
          <button id="mark-all-read">Mark All as Read</button>
        </div>
        
        <div id="notifications-list" class="notifications-container"></div>
      </section>
      
      <!-- Goals Section (Employee) -->
      <section id="goals-section" class="content-section">
        <div class="section-header">
          <h2>Your Goals</h2>
          <button id="add-goal-btn">Add New Goal</button>
        </div>
        
        <div class="goals-summary">
          <div class="goal-stat">
            <h3>Total Goals</h3>
            <p id="total-goals">0</p>
          </div>
          <div class="goal-stat">
            <h3>Completed</h3>
            <p id="completed-goals">0</p>
          </div>
          <div class="goal-stat">
            <h3>Completion Rate</h3>
            <p id="completion-rate">0%</p>
          </div>
        </div>
        
        <div id="goals-list" class="cards-container"></div>
        
        <!-- Goal Modal -->
        <div id="goal-modal" class="modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3 id="goal-modal-title">Add New Goal</h3>
            <form id="goal-form">
              <input type="hidden" id="goal-id">
              <div class="form-group">
                <label>Description</label>
                <input type="text" id="goal-description" required>
              </div>
              <div class="form-group">
                <label>Target Amount (₱)</label>
                <input type="number" id="goal-amount" required>
              </div>
              <div class="form-group">
                <label>Target Date</label>
                <input type="date" id="goal-date">
              </div>
              <div class="form-group">
                <label>Current Progress (%)</label>
                <input type="range" id="goal-progress" min="0" max="100" value="0">
                <span id="progress-value">0%</span>
              </div>
              <button type="submit" id="goal-submit-btn">Save Goal</button>
            </form>
          </div>
        </div>
      </section>
      
      <!-- Reports Section (Admin) -->
      <section id="reports-section" class="content-section">
        <div class="section-header">
          <h2>User Reports</h2>
          <div class="report-filters">
            <select id="report-status-filter">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>
        
        <div id="reports-list" class="cards-container"></div>
      </section>
      
      <!-- Admin Section -->
      <section id="admin-section" class="content-section">
        <h2>Admin Dashboard</h2>
        
        <div class="admin-tools">
          <div class="admin-card">
            <h3>User Management</h3>
            <div class="search-box">
              <input type="text" id="user-search" placeholder="Search users...">
              <button id="search-users-btn">Search</button>
            </div>
            <div id="users-list" class="admin-list"></div>
          </div>
          
          <div class="admin-card">
            <h3>Job Management</h3>
            <div class="search-box">
              <input type="text" id="admin-job-search" placeholder="Search jobs...">
              <button id="search-jobs-btn">Search</button>
            </div>
            <div id="admin-jobs-list" class="admin-list"></div>
          </div>
        </div>
        
        <div class="admin-actions">
          <button id="generate-report-btn" class="admin-btn">
            <i class="fas fa-file-pdf"></i> Generate User Report
          </button>
          <button id="view-stats-btn" class="admin-btn">
            <i class="fas fa-chart-bar"></i> View Barangay Stats
          </button>
        </div>
        
        <!-- Barangay Stats Modal -->
        <div id="stats-modal" class="modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Barangay Statistics</h3>
            <select id="barangay-select">
              <!-- Barangay options will be populated from JS -->
            </select>
            <div id="barangay-stats" class="stats-container"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script src="/src/landing.js" type="module"></script>
</body>
</html>