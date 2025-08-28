import apiService from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to access settings');
    window.location.href = '/login.html';
    return;
  }

  // Load current settings
  loadSettings();
});

async function loadSettings() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const response = await apiService.getProfile(userData.userId);
    
    if (response.user) {
      const user = response.user;
      
      // Load notification preferences
      if (user.notificationPreferences) {
        document.getElementById('notifJob').checked = user.notificationPreferences.job || true;
        document.getElementById('notifMessage').checked = user.notificationPreferences.message || true;
      }
      
      // Load language preference
      if (user.languagePreference) {
        document.getElementById(user.languagePreference === 'tagalog' ? 'tagalog-lang' : 'english-lang').checked = true;
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    document.getElementById('settingsError').textContent = 'Failed to load settings';
  }
}

async function saveSettings() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const settings = {
      notificationPreferences: {
        job: document.getElementById('notifJob').checked,
        message: document.getElementById('notifMessage').checked
      },
      languagePreference: document.querySelector('input[name="language"]:checked').value
    };
    
    const response = await apiService.updateProfile(userData.userId, settings);
    
    if (response.success) {
      document.getElementById('settingsSuccess').textContent = 'Settings saved successfully';
      setTimeout(() => {
        document.getElementById('settingsSuccess').textContent = '';
      }, 3000);
    } else {
      document.getElementById('settingsError').textContent = response.message || 'Error saving settings';
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    document.getElementById('settingsError').textContent = error.message || 'Failed to save settings';
  }
}

function changePassword() {
  const newPassword = prompt('Enter your new password:');
  if (newPassword && newPassword.length >= 8) {
    // In a real app, you would call an API to change the password
    alert('Password change request would be sent to the server');
  } else if (newPassword) {
    alert('Password must be at least 8 characters long');
  }
}

function contactSupport() {
  alert('Support contact feature would open a form or email client');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.href = '/index.html';
}

// Make functions available globally
window.saveSettings = saveSettings;
window.changePassword = changePassword;
window.contactSupport = contactSupport;
window.logout = logout;