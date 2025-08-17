document.getElementById("registerForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  
  const formData = new FormData();
  formData.append("firstName", document.getElementById("firstName").value);
  formData.append("lastName", document.getElementById("lastName").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("password", document.getElementById("password").value);
  formData.append("mobileNo", document.getElementById("mobileNo").value);
  formData.append("barangay", document.getElementById("barangay").value);
  formData.append("idType", document.getElementById("idType").value);
  formData.append("idNumber", document.getElementById("idNumber").value);

  // Image files
  if(document.getElementById("idFrontImage").files[0])
    formData.append("idFrontImage", document.getElementById("idFrontImage").files[0]);
  if(document.getElementById("idBackImage").files[0])
    formData.append("idBackImage", document.getElementById("idBackImage").files[0]);

  // UserType and Gender
  formData.append("userType", document.getElementById("userType").value);
  if(document.getElementById("gender").value)
    formData.append("gender", document.getElementById("gender").value);

  const registerError = document.getElementById("registerError");
  registerError.textContent = "";

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if(res.ok && data.success){
      showPopup();
    } else {
      registerError.textContent = (data.alert || "Hindi matagumpay ang pagrehistro.");
    }
  } catch (err) {
    registerError.textContent = "May problema sa koneksyon.";
  }
});

// Popup logic
function showPopup() {
  document.getElementById("successPopup").classList.add("show");
}
function closePopup() {
  document.getElementById("successPopup").classList.remove("show");
  window.location.href = "login.html";
}