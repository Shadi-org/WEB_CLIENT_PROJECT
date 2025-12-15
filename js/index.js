// Index page script
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        // User is logged in, could show different UI
        console.log('User is logged in:', JSON.parse(currentUser));
    }
});
