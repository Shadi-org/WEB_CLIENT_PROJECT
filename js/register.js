// Registration page script
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const imageUrlInput = document.getElementById("imageUrl");
  const imagePreview = document.getElementById("imagePreview");

  // Toggle password visibility
  togglePasswordBtn.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.querySelector("i").classList.toggle("bi-eye");
    this.querySelector("i").classList.toggle("bi-eye-slash");
  });

  // Image preview
  imageUrlInput.addEventListener("input", function () {
    const url = this.value.trim();
    if (url) {
      const img = imagePreview.querySelector("img");
      img.src = url;
      img.onload = function () {
        imagePreview.style.display = "block";
      };
      img.onerror = function () {
        imagePreview.style.display = "none";
      };
    } else {
      imagePreview.style.display = "none";
    }
  });

  // Form validation and submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    // Get form values
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const firstName = document.getElementById("firstName").value.trim();
    const imageUrl = document.getElementById("imageUrl").value.trim();

    let isValid = true;

    // Validate username
    if (!username) {
      showError("username", "usernameError", "Please enter a username");
      isValid = false;
    } else if (isUsernameTaken(username)) {
      showError("username", "usernameError", "Username already exists");
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      showError("password", "passwordError", passwordValidation.message);
      isValid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      showError(
        "confirmPassword",
        "confirmPasswordError",
        "Passwords do not match"
      );
      isValid = false;
    }

    // Validate first name
    if (!firstName) {
      showError("firstName", "firstNameError", "Please enter your first name");
      isValid = false;
    }

    // Validate image URL (if provided)
    if (imageUrl && !isValidUrl(imageUrl)) {
      showError("imageUrl", "imageUrlError", "Invalid URL format");
      isValid = false;
    }

    if (isValid) {
      // Create user object
      const user = {
        id: generateUserId(),
        username: username,
        password: password,
        firstName: firstName,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
      };

      // Save user to localStorage
      saveUser(user);

      // Show success modal
      const successModal = new bootstrap.Modal(
        document.getElementById("successModal")
      );
      successModal.show();

      // Redirect to login page after 2 seconds
      setTimeout(function () {
        window.location.href = "login.html";
      }, 2000);
    }
  });

  // Helper functions
  function clearErrors() {
    const inputs = form.querySelectorAll(".form-control");
    inputs.forEach((input) => {
      input.classList.remove("is-invalid");
    });
  }

  function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    input.classList.add("is-invalid");
    error.textContent = message;
  }

  function validatePassword(password) {
    if (!password) {
      return { valid: false, message: "Please enter a password" };
    }
    if (password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters",
      };
    }
    if (!/[a-zA-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number",
      };
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character",
      };
    }
    return { valid: true };
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  function isUsernameTaken(username) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return users.some(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  function generateUserId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  function saveUser(user) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));

    // Initialize empty playlists for the user
    const playlists = JSON.parse(localStorage.getItem("playlists") || "{}");
    playlists[user.id] = [];
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }
});
