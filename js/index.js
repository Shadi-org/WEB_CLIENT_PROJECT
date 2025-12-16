// Load site data from JSON and populate the page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/site-data.json');
        const data = await response.json();
        
        // Populate profile info
        document.getElementById('profile-name').textContent = data.name;
        document.getElementById('student-id').textContent = data.studentId;
        
        // Populate links
        document.getElementById('github-link').href = data.github;
        document.getElementById('live-link').href = data.liveSite;
    } catch (error) {
        console.error('Error loading site data:', error);
    }
});
