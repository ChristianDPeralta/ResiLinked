// src/register.js - Updated
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");
const registerError = document.getElementById("registerError");

// Real-time password match check
function checkPasswordsMatch() {
  if (confirmPasswordInput.value === "") {
    confirmPasswordInput.style.borderColor = "";
    passwordError.textContent = "";
    return;
  }

  if (passwordInput.value === confirmPasswordInput.value) {
    confirmPasswordInput.style.borderColor = "green";
    passwordError.style.color = "green";
    passwordError.textContent = "Password match!";
  } else {
    confirmPasswordInput.style.borderColor = "red";
    passwordError.style.color = "red";
    passwordError.textContent = "Password do not match!";
  }
}

passwordInput.addEventListener("input", checkPasswordsMatch);
confirmPasswordInput.addEventListener("input", checkPasswordsMatch);

// Form submission

document.getElementById("registerForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  if (passwordInput.value !== confirmPasswordInput.value) {
    alert("Passwords do not match!");
    return;
  }

  const formData = new FormData();
  formData.append("firstName", document.getElementById("firstName").value);
  formData.append("lastName", document.getElementById("lastName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("password", passwordInput.value);
  formData.append("mobileNo", document.getElementById("mobileNo").value);
  formData.append("address", document.getElementById("address").value);
  formData.append("barangay", document.getElementById("barangay").value);
  formData.append("gender", document.getElementById("gender").value);
  formData.append("idType", document.getElementById("idType").value);
  formData.append("idNumber", document.getElementById("idNumber").value);
  formData.append("userType", document.getElementById("userType").value);

  const idFrontImageInput = document.getElementById("idFrontImage");
  if (idFrontImageInput.files.length > 0) formData.append("idFrontImage", idFrontImageInput.files[0]);

  const idBackImageInput = document.getElementById("idBackImage");
  if (idBackImageInput.files.length > 0) formData.append("idBackImage", idBackImageInput.files[0]);

  const profilePictureInput = document.getElementById("profilePicture");
  if (profilePictureInput && profilePictureInput.files.length > 0) formData.append("profilePicture", profilePictureInput.files[0]);

  const skillsInput = document.getElementById("skills");
  if (skillsInput && skillsInput.value.trim() !== "") {
    const skillsArray = skillsInput.value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    skillsArray.forEach(skill => formData.append("skills", skill));
  }

  registerError.textContent = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showVerificationPopup(data.data.email);
    } else {
      registerError.textContent = data.alert || "Registration failed";
    }
  } catch (err) {
    registerError.textContent = "Connection error. Please try again.";
    console.error(err);
  }
});

// Add these new functions for verification
window.showVerificationPopup = function(email) {
  const popup = document.getElementById("verificationPopup");
  const emailSpan = document.getElementById("verificationEmail");
  emailSpan.textContent = email;
  popup.style.display = "block";
};

window.closeVerificationPopup = function() {
  const popup = document.getElementById("verificationPopup");
  popup.style.display = "none";
  window.location.href = "/login.html";
};

window.deleteUnverifiedAccount = async function() {
  try {
    const email = document.getElementById("verificationEmail").textContent;
    const res = await fetch("http://localhost:5000/api/auth/delete-unverified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    
    const data = await res.json();
    if (res.ok) {
      alert("Account deleted successfully.");
      window.location.href = "/register.html";
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting account.");
  }
};

<div id="verificationPopup" class="popup-modal" style="display:none;">
  <div class="popup-content">
    <h3>Verify Your Email</h3>
    <p>We've sent a verification email to <span id="verificationEmail"></span>. Please check your inbox and click the verification link.</p>
    <p>If you didn't request this account, you can delete it:</p>
    <button onclick="deleteUnverifiedAccount()" class="btn danger">Delete Account</button>
    <button onclick="closeVerificationPopup()" class="btn">OK</button>
  </div>
</div>