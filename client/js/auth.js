// Authentication helper functions
const Auth = {
    // Check if user is logged in
    isLoggedIn: function() {
        return sessionStorage.getItem('currentUser') !== null;
    },

    // Get current user
    getCurrentUser: function() {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    },

    // Set current user
    setCurrentUser: function(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    },

    // Logout user
    logout: async function() {
        try {
            await API.logout();
        } catch (e) {
            // Ignore errors
        }
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('searchState');
        window.location.href = 'login.html';
    },

    // Require authentication - redirect to login if not logged in
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Setup user info in navbar
    setupNavbar: function() {
        const user = this.getCurrentUser();
        if (!user) return;

        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const defaultAvatarEl = document.getElementById('defaultAvatar');

        if (userNameEl) {
            userNameEl.textContent = user.firstName;
        }

        if (user.imageUrl && userAvatarEl) {
            userAvatarEl.src = user.imageUrl;
            userAvatarEl.style.display = 'block';
            if (defaultAvatarEl) {
                defaultAvatarEl.style.display = 'none';
            }
        }

        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
};

// Auto-check authentication on page load for protected pages
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check for login and register pages
    const publicPages = ['login.html', 'register.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!publicPages.includes(currentPage)) {
        if (!Auth.requireAuth()) return;
        Auth.setupNavbar();
    }
});
