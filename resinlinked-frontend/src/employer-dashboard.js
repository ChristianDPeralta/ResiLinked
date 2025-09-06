import { apiCall } from './api.js';

// Tab management
let currentTab = 'my-jobs';
let userData = null;
let userJobs = [];
let userApplications = [];
let userRatings = [];
let workers = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Get user data
        userData = await getCurrentUser();
        if (!userData || (userData.userType !== 'employer' && userData.userType !== 'both')) {
            alert('Access denied. This page is for employers only.');
            window.location.href = 'landing.html';
            return;
        }

        // Initialize tab functionality
        initializeTabs();
        
        // Load initial data
        await loadDashboardStats();
        await loadTabContent(currentTab);

        // Initialize form handlers
        initializeFormHandlers();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Failed to load dashboard. Please try logging in again.');
        window.location.href = 'login.html';
    }
});

// Get current user data
async function getCurrentUser() {
    try {
        const response = await apiCall('/users/me', 'GET');
        return response.user || response;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Initialize tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Load tab content
            currentTab = tabId;
            await loadTabContent(tabId);
        });
    });
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const [jobs, applications, ratings] = await Promise.all([
            apiCall('/jobs/my-jobs', 'GET'),
            apiCall('/jobs/my-applications-received', 'GET'),
            apiCall('/ratings/given', 'GET')
        ]);

        const activeJobs = jobs.filter(job => job.isOpen).length;
        const totalApplications = applications.reduce((sum, job) => sum + job.applicants.length, 0);
        const completedJobs = jobs.filter(job => job.completed).length;
        const avgRating = ratings.length > 0 
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : '0.0';

        document.getElementById('activeJobsCount').textContent = activeJobs;
        document.getElementById('totalApplicationsCount').textContent = totalApplications;
        document.getElementById('completedJobsCount').textContent = completedJobs;
        document.getElementById('averageRating').textContent = avgRating;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load content for specific tab
async function loadTabContent(tabId) {
    switch (tabId) {
        case 'my-jobs':
            await loadMyJobs();
            break;
        case 'search-workers':
            await loadWorkers();
            break;
        case 'applications':
            await loadApplications();
            break;
        case 'ratings':
            await loadRatings();
            break;
        case 'post-job':
            // Form is already rendered, just clear it
            clearJobForm();
            break;
    }
}

// Load my job posts
async function loadMyJobs() {
    const loadingEl = document.getElementById('myJobsLoading');
    const containerEl = document.getElementById('myJobsContainer');
    const emptyEl = document.getElementById('myJobsEmpty');

    try {
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';
        emptyEl.style.display = 'none';

        const jobs = await apiCall('/jobs/my-jobs', 'GET');
        userJobs = jobs;

        if (jobs.length === 0) {
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        renderJobCards(jobs);
        loadingEl.style.display = 'none';
        containerEl.style.display = 'grid';

    } catch (error) {
        console.error('Error loading jobs:', error);
        loadingEl.innerHTML = '<div class="error">Failed to load jobs. Please try again.</div>';
    }
}

// Render job cards
function renderJobCards(jobs) {
    const container = document.getElementById('myJobsContainer');
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <h3 class="job-title">${job.title}</h3>
            <div class="job-price">₱${job.price.toLocaleString()}</div>
            <div class="job-meta">
                <div class="meta-item">
                    <span>📍</span> ${job.barangay}
                </div>
                <div class="meta-item">
                    <span>📅</span> ${new Date(job.datePosted).toLocaleDateString()}
                </div>
                <div class="meta-item">
                    <span>👥</span> ${job.applicants ? job.applicants.length : 0} applicants
                </div>
            </div>
            <div class="job-meta">
                <span class="status-badge status-${job.isOpen ? 'open' : 'closed'}">
                    ${job.isOpen ? 'Open' : 'Closed'}
                </span>
                ${job.assignedTo ? `<span class="status-badge status-assigned">Assigned</span>` : ''}
                ${job.completed ? `<span class="status-badge status-completed">Completed</span>` : ''}
            </div>
            <p>${job.description}</p>
            <div class="actions">
                <button class="btn secondary small" onclick="viewJobDetails('${job._id}')">View Details</button>
                ${job.isOpen ? `<button class="btn warning small" onclick="closeJob('${job._id}')">Close Job</button>` : ''}
                <button class="btn danger small" onclick="deleteJob('${job._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load workers
async function loadWorkers() {
    const loadingEl = document.getElementById('workersLoading');
    const containerEl = document.getElementById('workersContainer');
    const emptyEl = document.getElementById('workersEmpty');

    try {
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';
        emptyEl.style.display = 'none';

        const response = await apiCall('/users/workers', 'GET');
        workers = response.users || response;

        if (workers.length === 0) {
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        renderWorkerCards(workers);
        loadingEl.style.display = 'none';
        containerEl.style.display = 'grid';

    } catch (error) {
        console.error('Error loading workers:', error);
        loadingEl.innerHTML = '<div class="error">Failed to load workers. Please try again.</div>';
    }
}

// Render worker cards
function renderWorkerCards(workers) {
    const container = document.getElementById('workersContainer');
    
    container.innerHTML = workers.map(worker => `
        <div class="worker-card">
            <h3 class="job-title">${worker.firstName} ${worker.lastName}</h3>
            <div class="job-meta">
                <div class="meta-item">
                    <span>🏠</span> ${worker.barangay}
                </div>
                <div class="meta-item">
                    <span>✉️</span> ${worker.email}
                </div>
                <div class="meta-item">
                    <span>📱</span> ${worker.mobileNo}
                </div>
            </div>
            ${worker.skills && worker.skills.length > 0 ? `
                <div class="skill-tags">
                    ${worker.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            ` : '<div class="skill-tags"><span style="color: #666; font-style: italic;">No skills listed</span></div>'}
            <div class="actions">
                <button class="btn primary small" onclick="viewWorkerDetails('${worker._id}')">View Profile</button>
                <button class="btn secondary small" onclick="contactWorker('${worker._id}')">Contact</button>
            </div>
        </div>
    `).join('');
}

// Load applications
async function loadApplications() {
    const loadingEl = document.getElementById('applicationsLoading');
    const containerEl = document.getElementById('applicationsContainer');
    const emptyEl = document.getElementById('applicationsEmpty');

    try {
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';
        emptyEl.style.display = 'none';

        const jobs = await apiCall('/jobs/my-jobs', 'GET');
        const jobsWithApplications = jobs.filter(job => job.applicants && job.applicants.length > 0);

        if (jobsWithApplications.length === 0) {
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        // Populate job filter dropdown
        const jobFilter = document.getElementById('applicationsJobFilter');
        jobFilter.innerHTML = '<option value="">All Jobs</option>' + 
            jobs.map(job => `<option value="${job._id}">${job.title}</option>`).join('');

        renderApplicationsTable(jobsWithApplications);
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error loading applications:', error);
        loadingEl.innerHTML = '<div class="error">Failed to load applications. Please try again.</div>';
    }
}

// Render applications table
function renderApplicationsTable(jobs) {
    const tbody = document.getElementById('applicationsTableBody');
    const applications = [];
    
    jobs.forEach(job => {
        job.applicants.forEach(applicant => {
            applications.push({
                ...applicant,
                jobTitle: job.title,
                jobId: job._id,
                jobPrice: job.price
            });
        });
    });
    
    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>
                ${app.user ? `${app.user.firstName} ${app.user.lastName}` : 'Unknown User'}
                <br><small>${app.user ? app.user.email : ''}</small>
            </td>
            <td>
                ${app.jobTitle}
                <br><small>₱${app.jobPrice ? app.jobPrice.toLocaleString() : '0'}</small>
            </td>
            <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${app.status}">
                    ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn secondary small" onclick="viewApplicationDetails('${app.jobId}', '${app.user._id}')">View</button>
                    ${app.status === 'pending' ? `
                        <button class="btn primary small" onclick="acceptApplication('${app.jobId}', '${app.user._id}')">Accept</button>
                        <button class="btn danger small" onclick="rejectApplication('${app.jobId}', '${app.user._id}')">Reject</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Load ratings
async function loadRatings() {
    const loadingEl = document.getElementById('ratingsLoading');
    const containerEl = document.getElementById('ratingsContainer');
    const emptyEl = document.getElementById('ratingsEmpty');

    try {
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';
        emptyEl.style.display = 'none';

        const ratings = await apiCall('/ratings/given', 'GET');
        userRatings = ratings;

        if (ratings.length === 0) {
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        renderRatingsTable(ratings);
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error loading ratings:', error);
        loadingEl.innerHTML = '<div class="error">Failed to load ratings. Please try again.</div>';
    }
}

// Render ratings table
function renderRatingsTable(ratings) {
    const tbody = document.getElementById('ratingsTableBody');
    
    tbody.innerHTML = ratings.map(rating => `
        <tr>
            <td>
                ${rating.ratedUser ? `${rating.ratedUser.firstName} ${rating.ratedUser.lastName}` : 'Unknown User'}
            </td>
            <td>${rating.job ? rating.job.title : 'Unknown Job'}</td>
            <td>
                ${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}
                <br><small>(${rating.rating}/5)</small>
            </td>
            <td>${rating.comment || 'No comment'}</td>
            <td>${new Date(rating.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Initialize form handlers
function initializeFormHandlers() {
    // Job posting form
    const jobForm = document.getElementById('newJobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }

    // Skills input for job form
    const skillsInput = document.getElementById('jobSkills');
    if (skillsInput) {
        skillsInput.addEventListener('keydown', handleSkillInput);
    }

    // Search handlers
    const searchJobsBtn = document.getElementById('searchJobsBtn');
    if (searchJobsBtn) {
        searchJobsBtn.addEventListener('click', filterMyJobs);
    }

    const searchWorkersBtn = document.getElementById('searchWorkersBtn');
    if (searchWorkersBtn) {
        searchWorkersBtn.addEventListener('click', filterWorkers);
    }

    const filterApplicationsBtn = document.getElementById('filterApplicationsBtn');
    if (filterApplicationsBtn) {
        filterApplicationsBtn.addEventListener('click', filterApplications);
    }

    const filterRatingsBtn = document.getElementById('filterRatingsBtn');
    if (filterRatingsBtn) {
        filterRatingsBtn.addEventListener('click', filterRatings);
    }
}

// Handle job form submission
async function handleJobSubmit(e) {
    e.preventDefault();
    
    const errorEl = document.getElementById('jobFormError');
    const successEl = document.getElementById('jobFormSuccess');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        const formData = new FormData(e.target);
        const jobData = Object.fromEntries(formData.entries());
        
        // Get skills from tags
        const skillTags = document.querySelectorAll('#jobSkillTags .skill-tag');
        jobData.skillsRequired = Array.from(skillTags).map(tag => 
            tag.textContent.replace('×', '').trim()
        );

        const response = await apiCall('/jobs', 'POST', jobData);
        
        successEl.textContent = 'Job posted successfully!';
        successEl.style.display = 'block';
        
        // Clear form
        clearJobForm();
        
        // Refresh data
        await loadDashboardStats();
        if (currentTab === 'my-jobs') {
            await loadMyJobs();
        }
        
    } catch (error) {
        console.error('Error posting job:', error);
        errorEl.textContent = error.message || 'Failed to post job. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Job';
    }
}

// Handle skill input for job form
function handleSkillInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill(e.target.value.trim(), 'jobSkillTags');
        e.target.value = '';
    }
}

// Add skill tag
function addSkill(skill, containerId) {
    if (!skill) return;
    
    const container = document.getElementById(containerId);
    const existingSkills = Array.from(container.children).map(tag => 
        tag.textContent.replace('×', '').trim()
    );
    
    if (existingSkills.includes(skill)) return;
    
    const skillTag = document.createElement('span');
    skillTag.className = 'skill-tag';
    skillTag.innerHTML = `${skill} <span class="remove-skill" onclick="this.parentElement.remove()">×</span>`;
    
    container.appendChild(skillTag);
}

// Clear job form
function clearJobForm() {
    const form = document.getElementById('newJobForm');
    if (form) {
        form.reset();
        document.getElementById('jobSkillTags').innerHTML = '';
        document.getElementById('jobFormError').style.display = 'none';
        document.getElementById('jobFormSuccess').style.display = 'none';
    }
}

// Filter functions
function filterMyJobs() {
    const searchTerm = document.getElementById('jobsSearch').value.toLowerCase();
    const statusFilter = document.getElementById('jobsStatusFilter').value;
    
    let filteredJobs = userJobs;
    
    if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => 
            job.title.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filteredJobs = filteredJobs.filter(job => {
            if (statusFilter === 'open') return job.isOpen;
            if (statusFilter === 'closed') return !job.isOpen;
            if (statusFilter === 'assigned') return job.assignedTo;
            if (statusFilter === 'completed') return job.completed;
            return true;
        });
    }
    
    renderJobCards(filteredJobs);
}

function filterWorkers() {
    const searchTerm = document.getElementById('workersSearch').value.toLowerCase();
    const barangayFilter = document.getElementById('workersBarangayFilter').value;
    
    let filteredWorkers = workers;
    
    if (searchTerm) {
        filteredWorkers = filteredWorkers.filter(worker => 
            `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchTerm) ||
            (worker.skills && worker.skills.some(skill => skill.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (barangayFilter) {
        filteredWorkers = filteredWorkers.filter(worker => worker.barangay === barangayFilter);
    }
    
    renderWorkerCards(filteredWorkers);
}

function filterApplications() {
    // This would filter the applications table based on selected filters
    loadApplications(); // For now, just reload
}

function filterRatings() {
    const ratingFilter = document.getElementById('ratingsFilter').value;
    
    let filteredRatings = userRatings;
    
    if (ratingFilter) {
        filteredRatings = filteredRatings.filter(rating => 
            rating.rating === parseInt(ratingFilter)
        );
    }
    
    renderRatingsTable(filteredRatings);
}

// Action functions
window.viewJobDetails = function(jobId) {
    // Implement job details modal
    alert('Job details feature coming soon!');
};

window.closeJob = async function(jobId) {
    if (!confirm('Are you sure you want to close this job?')) return;
    
    try {
        await apiCall(`/jobs/${jobId}/close`, 'PUT');
        await loadMyJobs();
        await loadDashboardStats();
    } catch (error) {
        alert('Failed to close job: ' + error.message);
    }
};

window.deleteJob = async function(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    
    try {
        await apiCall(`/jobs/${jobId}`, 'DELETE');
        await loadMyJobs();
        await loadDashboardStats();
    } catch (error) {
        alert('Failed to delete job: ' + error.message);
    }
};

window.viewWorkerDetails = function(workerId) {
    // Implement worker details modal
    alert('Worker details feature coming soon!');
};

window.contactWorker = function(workerId) {
    // Implement contact worker feature
    alert('Contact feature coming soon!');
};

window.viewApplicationDetails = function(jobId, applicantId) {
    // Implement application details modal
    alert('Application details feature coming soon!');
};

window.acceptApplication = async function(jobId, userId) {
    if (!confirm('Are you sure you want to accept this application?')) return;
    
    try {
        await apiCall(`/jobs/${jobId}/assign`, 'POST', { userId });
        await loadApplications();
        await loadMyJobs();
        await loadDashboardStats();
        alert('Application accepted successfully!');
    } catch (error) {
        alert('Failed to accept application: ' + error.message);
    }
};

window.rejectApplication = async function(jobId, userId) {
    if (!confirm('Are you sure you want to reject this application?')) return;
    
    try {
        await apiCall(`/jobs/${jobId}/reject`, 'POST', { userId });
        await loadApplications();
        alert('Application rejected successfully!');
    } catch (error) {
        alert('Failed to reject application: ' + error.message);
    }
};

// Modal functions
window.closeWorkerModal = function() {
    document.getElementById('workerModal').style.display = 'none';
};

window.closeApplicationModal = function() {
    document.getElementById('applicationModal').style.display = 'none';
};

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const workerModal = document.getElementById('workerModal');
    const applicationModal = document.getElementById('applicationModal');
    
    if (event.target === workerModal) {
        workerModal.style.display = 'none';
    }
    if (event.target === applicationModal) {
        applicationModal.style.display = 'none';
    }
});
