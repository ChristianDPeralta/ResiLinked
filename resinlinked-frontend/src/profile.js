import apiService from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  if (!token || !userData.userId) {
    alert("Please log in to view your profile");
    window.location.href = "/login.html";
    return;
  }

  try {
    // Load user profile (unwrap user)
    const response = await apiService.getProfile(userData.userId);
    const profile = response.user; // <-- unwrap
    renderProfile(profile);
    
    // Load user ratings
    const ratingsResponse = await apiService.getUserRatings(userData.userId);
    renderRatings(ratingsResponse);
  } catch (error) {
    console.error("Error loading profile:", error);
    alert("Failed to load profile data");
  }
});

function renderProfile(profile) {
  if (!profile) return;
  
  // Update profile header
  const avatar = document.querySelector('.profile-avatar');
  const name = document.querySelector('.profile-header-info h2');
  const barangay = document.querySelector('.profile-header-info p');
  
  if (name) name.textContent = `${profile.firstName} ${profile.lastName}`;
  if (barangay) {
    barangay.innerHTML = `Barangay ${profile.barangay} <span class="verified-badge">${profile.isVerified ? 'Verified' : 'Unverified'}</span>`;
  }
  
  if (avatar && profile.profilePicture) {
    avatar.src = `data:image/jpeg;base64,${profile.profilePicture}`;
  }
  
  // Update skills
  const skillsContainer = document.querySelector('.skills-list');
  if (skillsContainer && profile.skills && profile.skills.length > 0) {
    skillsContainer.innerHTML = profile.skills.map(skill => 
      `<span class="skill-tag">${skill}</span>`
    ).join('');
  } else if (skillsContainer) {
    skillsContainer.innerHTML = '<p class="no-data">No skills added yet</p>';
  }
  
  // Update description
  const description = document.querySelector('.profile-description p');
  if (description) {
    description.textContent = profile.bio || 'No description provided';
  }
  
  // Update contact info
  const contact = document.querySelector('.profile-contact p');
  if (contact) {
    contact.innerHTML = `${profile.email || 'No email'}<br>${profile.mobileNo || 'No phone number'}`;
  }
  
  // Update languages if available
  const languagesContainer = document.querySelector('.languages-list');
  if (languagesContainer) {
    languagesContainer.innerHTML = '<span class="lang-tag">Tagalog</span><span class="lang-tag">English</span>';
  }
}

function renderRatings(ratingsData) {
  const ratingsContainer = document.querySelector('.ratings-list');
  if (!ratingsContainer) return;
  
  if (!ratingsData.ratings || ratingsData.ratings.length === 0) {
    ratingsContainer.innerHTML = '<p class="no-data">No ratings yet</p>';
    return;
  }
  
  ratingsContainer.innerHTML = ratingsData.ratings.map(rating => {
    const stars = '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating);
    const date = new Date(rating.createdAt).toLocaleDateString();
    
    return `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars}</div>
        <div class="testimonial-content">${rating.comment || 'No comment provided'}</div>
        <div class="testimonial-footer">
          <span class="testimonial-avatar"></span>
          <span class="testimonial-name">${rating.rater?.firstName || 'Anonymous'} ${rating.rater?.lastName || ''}</span>
          <span class="testimonial-role">${date}</span>
        </div>
      </div>
    `;
  }).join('');
}
