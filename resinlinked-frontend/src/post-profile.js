import apiService from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is employee
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.userType !== 'employee' && userData.userType !== 'both') {
    alert('Employee access required');
    window.location.href = '/landing.html';
    return;
  }

  initProfileForm();
});

function initProfileForm() {
  const skillInput = document.getElementById('skillInput');
  const skillTags = document.getElementById('skillTags');
  const form = document.getElementById('profileForm');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  let skills = [];

  // Skill input functionality
  skillInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && skillInput.value.trim()) {
      e.preventDefault();
      addSkill(skillInput.value.trim());
      skillInput.value = '';
    }
  });

  function addSkill(skill) {
    if (!skills.includes(skill)) {
      skills.push(skill);
      renderSkills();
    }
  }

  function removeSkill(skill) {
    skills = skills.filter(s => s !== skill);
    renderSkills();
  }

  function renderSkills() {
    skillTags.innerHTML = '';
    skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.innerHTML = `${skill} <span class="remove-skill" title="Remove" onclick="removeSkill('${skill}')">&times;</span>`;
      skillTags.appendChild(tag);
    });
  }

  // Save button functionality
  document.getElementById('saveBtn').onclick = function() {
    const formData = getFormData();
    localStorage.setItem('draftProfile', JSON.stringify(formData));
    formSuccess.textContent = 'Profile saved as draft successfully!';
    setTimeout(() => { formSuccess.textContent = ''; }, 3000);
  };

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    formError.textContent = '';
    formSuccess.textContent = '';
    
    if (skills.length === 0) {
      formError.textContent = 'Please add at least one skill';
      return;
    }

    const profileData = getFormData();
    
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const response = await apiService.updateProfile(userData.userId, profileData);
      
      if (response.success) {
        formSuccess.textContent = 'Profile published successfully!';
        // Clear form and skills
        form.reset();
        skills = [];
        renderSkills();
        localStorage.removeItem('draftProfile');
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = '/employee-dashboard.html';
        }, 2000);
      } else {
        formError.textContent = response.message || 'Error publishing profile';
      }
    } catch (error) {
      console.error('Error publishing profile:', error);
      formError.textContent = error.message || 'Failed to publish profile. Please try again.';
    }
  });

  function getFormData() {
    return {
      headline: document.getElementById('headline').value,
      bio: document.getElementById('bio').value,
      hourlyRate: parseFloat(document.getElementById('hourlyRate').value),
      experience: document.getElementById('experience').value,
      skills: skills,
      availability: document.getElementById('availability').value,
      profileVisible: true
    };
  }

  // Load draft if exists
  const draft = localStorage.getItem('draftProfile');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      document.getElementById('headline').value = draftData.headline || '';
      document.getElementById('bio').value = draftData.bio || '';
      document.getElementById('hourlyRate').value = draftData.hourlyRate || '';
      document.getElementById('experience').value = draftData.experience || '';
      document.getElementById('availability').value = draftData.availability || '';
      
      if (draftData.skills && draftData.skills.length > 0) {
        skills = draftData.skills;
        renderSkills();
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }

  // Make removeSkill available globally for the onclick handler
  window.removeSkill = removeSkill;
}