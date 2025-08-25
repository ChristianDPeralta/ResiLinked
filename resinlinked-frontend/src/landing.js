// src/landing.js

document.addEventListener("DOMContentLoaded", () => {
  const seeJobsBtn = document.getElementById("seeJobsBtn");
  const postJobBtn = document.getElementById("postJobBtn");
  const profileBtn = document.getElementById("profileBtn");

  if (seeJobsBtn) {
    seeJobsBtn.addEventListener("click", () => {
      alert("Redirecting to Jobs Page...");
      // window.location.href = "/jobs"; // example route
    });
  }

  if (postJobBtn) {
    postJobBtn.addEventListener("click", () => {
      alert("Redirecting to Post Job Page...");
      // window.location.href = "/post-job"; // example route
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      alert("Redirecting to Profile Page...");
      window.location.href = "/profile.html"; // change if different
    });
  }
});
