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
    form.addEventListener('submit', function(e) {
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

        // Authenticate user
        const user = authenticateUser(username, password);
        
        if (user) {
            // Store current user in sessionStorage
            const userData = {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                imageUrl: user.imageUrl
            };
            sessionStorage.setItem('currentUser', JSON.stringify(userData));

            // Redirect to search page
            window.location.href = 'search.html';
        } else {
            // Show error
            loginError.classList.remove('d-none');
            loginErrorMessage.textContent = 'Invalid username or password';
        }
    });

    // Helper function to authenticate user
    function authenticateUser(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => 
            user.username.toLowerCase() === username.toLowerCase() && 
            user.password === password
        );
    }
});
