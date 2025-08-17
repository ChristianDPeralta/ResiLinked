document.getElementById("registerForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("firstName", document.getElementById("firstName").value);
  formData.append("lastName", document.getElementById("lastName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("password", document.getElementById("password").value);
  formData.append("address", document.getElementById("address").value);
  formData.append("barangay", document.getElementById("barangay").value);
  formData.append("mobileNo", document.getElementById("contact").value); // matches backend
  formData.append("gender", document.getElementById("gender").value);
  formData.append("idType", document.getElementById("idType").value);
  formData.append("idNumber", document.getElementById("idNumber").value); // NEW

  // Add both front and back images
  const idFrontImageInput = document.getElementById("idFrontImage");
  if (idFrontImageInput.files.length > 0) {
    formData.append("idFrontImage", idFrontImageInput.files[0]);
  }
  const idBackImageInput = document.getElementById("idBackImage");
  if (idBackImageInput.files.length > 0) {
    formData.append("idBackImage", idBackImageInput.files[0]);
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
      registerError.textContent = (data.alert || data.message || "Hindi matagumpay ang pagrehistro.");
    }
  } catch (err) {
    registerError.textContent = "May problema sa koneksyon.";
  }
});

window.showPopup = function() {
  document.getElementById("successPopup").classList.add("show");
};
window.closePopup = function() {
  document.getElementById("successPopup").classList.remove("show");
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