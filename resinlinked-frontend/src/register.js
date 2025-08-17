document.getElementById("registerForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("firstName", document.getElementById("firstName").value);
  formData.append("lastName", document.getElementById("lastName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("password", document.getElementById("password").value);
  formData.append("address", document.getElementById("address").value);
  formData.append("barangay", document.getElementById("barangay").value);
  formData.append("mobileNo", document.getElementById("mobileNo").value);
  formData.append("gender", document.getElementById("gender").value);
  formData.append("idType", document.getElementById("idType").value);
  formData.append("idNumber", document.getElementById("idNumber").value);
  formData.append("userType", document.getElementById("userType").value);

  // Images
  const idFrontImageInput = document.getElementById("idFrontImage");
  if (idFrontImageInput.files.length > 0) {
    formData.append("idFrontImage", idFrontImageInput.files[0]);
  }
  const idBackImageInput = document.getElementById("idBackImage");
  if (idBackImageInput.files.length > 0) {
    formData.append("idBackImage", idBackImageInput.files[0]);
  }
  const profilePictureInput = document.getElementById("profilePicture");
  if (profilePictureInput && profilePictureInput.files.length > 0) {
    formData.append("profilePicture", profilePictureInput.files[0]);
  }

  // Skills (comma separated)
  const skillsInput = document.getElementById("skills");
  if (skillsInput && skillsInput.value.trim() !== "") {
    const skillsArray = skillsInput.value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    skillsArray.forEach(skill => formData.append("skills[]", skill));
  }

  const registerError = document.getElementById("registerError");
  registerError.textContent = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showPopup();
    } else {
      registerError.textContent = data.message || "Hindi matagumpay ang pagrehistro.";
      console.error("Registration error:", data);
    }
  } catch (err) {
    registerError.textContent = "May problema sa koneksyon.";
    console.error(err);
  }
});

window.showPopup = function() {
  const popup = document.getElementById("successPopup");
  popup.style.display = "block";
};

window.closePopup = function() {
  const popup = document.getElementById("successPopup");
  popup.style.display = "none";
  window.location.href = "/login.html";
};

document.getElementById('backHomeBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 300);
};

document.getElementById('loginLinkBtn').onclick = () => {
  document.body.classList.remove('fade-in');
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 300);
};
