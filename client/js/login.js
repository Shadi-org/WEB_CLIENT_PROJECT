// Login page script
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const loginErrorMessage = document.getElementById('loginErrorMessage');

    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'search.html';
        return;
    }

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous errors
        loginError.classList.add('d-none');
        
        // Get form values
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Validate inputs
        let isValid = true;
        
        if (!username) {
            document.getElementById('username').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('username').classList.remove('is-invalid');
        }

        if (!password) {
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('password').classList.remove('is-invalid');
        }

        if (!isValid) return;

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        submitBtn.disabled = true;

        try {
            // Call login API
            const result = await API.login(username, password);
            
            if (result.success) {
                // Store current user in sessionStorage
                Auth.setCurrentUser(result.user);
                // Redirect to search page
                window.location.href = 'search.html';
            } else {
                // Show error
                loginError.classList.remove('d-none');
                loginErrorMessage.textContent = result.message || 'Invalid username or password';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.classList.remove('d-none');
            loginErrorMessage.textContent = 'An error occurred. Please try again.';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});
