import apiService from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to post a job');
    window.location.href = '/login.html';
    return;
  }

  // Initialize the form
  initJobForm();
});

function initJobForm() {
  const skillInput = document.getElementById('skillInput');
  const skillTags = document.getElementById('skillTags');
  const skillError = document.getElementById('skillError');
  const form = document.getElementById('postJobForm');
  const formError = document.getElementById('formError');
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
      skillError.textContent = '';
    } else {
      skillError.textContent = 'Skill already added';
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
      tag.innerHTML = `${skill} <span class="remove-skill" title="Tanggalin" onclick="removeSkill('${skill}')">&times;</span>`;
      skillTags.appendChild(tag);
    });
  }

  // Save button functionality (local storage)
  document.getElementById('saveBtn').onclick = function() {
    const formData = getFormData();
    localStorage.setItem('draftJob', JSON.stringify(formData));
    alert('Ang trabaho ay na-save bilang draft.');
  };

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    formError.textContent = '';
    
    if (skills.length === 0) {
      formError.textContent = 'Please add at least one required skill';
      return;
    }

    const jobData = getFormData();
    
    try {
      const result = await apiService.createJob(jobData);
      
      if (result.success) {
        alert(`Job "${result.job.title}" posted successfully!`);
        // Clear form and skills
        form.reset();
        skills = [];
        renderSkills();
        localStorage.removeItem('draftJob');
        
        // Redirect to jobs page or show success message
        window.location.href = '/search-jobs.html';
      } else {
        formError.textContent = result.message || 'Error posting job';
      }
    } catch (error) {
      console.error('Error posting job:', error);
      formError.textContent = error.message || 'Failed to post job. Please try again.';
    }
  });

  function getFormData() {
    return {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      price: parseFloat(document.getElementById('price').value),
      barangay: document.getElementById('barangay').value,
      skillsRequired: skills,
      postMethod: document.querySelector('input[name="postMethod"]:checked').value
    };
  }

  // Load draft if exists
  const draft = localStorage.getItem('draftJob');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      document.getElementById('title').value = draftData.title || '';
      document.getElementById('description').value = draftData.description || '';
      document.getElementById('price').value = draftData.price || '';
      document.getElementById('barangay').value = draftData.barangay || '';
      
      if (draftData.skillsRequired && draftData.skillsRequired.length > 0) {
        skills = draftData.skillsRequired;
        renderSkills();
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }

  // Make removeSkill available globally for the onclick handler
  window.removeSkill = removeSkill;
}