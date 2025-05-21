// assets/js/landing-page-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';

const themesForLandingPage = [ // Ensure this matches themes linked in index.html <head>
    { value: 'theme-modern-professional', name: 'Modern & Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' }
];

document.addEventListener('DOMContentLoaded', () => {
    // --- Google Sign-In Callbacks & Admin Toggle (Moved from inline) ---
    window.onClientSignIn = function(googleUser) { // Make it global for Google's script to find
        var id_token = googleUser.getAuthResponse().id_token;
        console.log("CLIENT Google ID Token: " + id_token);
        alert("Client Signed In (Demo)! Token: " + id_token.substring(0, 30) + "...");
        // For demo, sign out immediately
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('Client signed out for demo.');
        });
    };

    window.onAdminSignIn = function(googleUser) { // Make it global
        var id_token = googleUser.getAuthResponse().id_token;
        console.log("ADMIN Google ID Token: " + id_token);
        alert("Admin Signed In (Demo)! Token: " + id_token.substring(0, 30) + "...\nBackend would verify admin status.");
        // For demo, sign out immediately
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('Admin signed out for demo.');
        });
        // In a real app, you'd redirect to pt-admin-mvp.html or similar
        // window.location.href = 'pt-admin-mvp.html'; 
    };

    const adminLoginLinkConceptual = document.getElementById('adminLoginLinkConceptual');
    const adminLoginLinkPlaceholder = document.getElementById('adminLoginLinkPlaceholder'); // In nav
    const adminLoginSection = document.getElementById('admin-login-section');

    function toggleAdminLogin(e) {
        e.preventDefault();
        if (adminLoginSection) {
            const isAdminSectionVisible = adminLoginSection.style.display === 'block';
            adminLoginSection.style.display = isAdminSectionVisible ? 'none' : 'block';
            if (!isAdminSectionVisible) {
                adminLoginSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    if (adminLoginLinkConceptual) adminLoginLinkConceptual.addEventListener('click', toggleAdminLogin);
    if (adminLoginLinkPlaceholder) adminLoginLinkPlaceholder.addEventListener('click', toggleAdminLogin);


    // --- Initialize Theme Switcher ---
    const themeSwitcherElement = document.getElementById('landingThemeSwitcher'); // New ID for landing page switcher
    const bodyElement = document.body; // The body is the primary themed area for the landing page

    if (themeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(
            themesForLandingPage,
            themeSwitcherElement,
            bodyElement, // Theme the whole body
            (newThemeValue, currentThemeObject) => {
                // Optional callback: if landing page has specific elements outside body
                // that need theme class re-applied (e.g., a fixed header not inheriting body class directly)
                // For now, theming the body should suffice for most landing page styles.
                // const landingPageWrapper = document.getElementById('landing-page-wrapper');
                // if (landingPageWrapper) {
                //     themesForLandingPage.forEach(t => landingPageWrapper.classList.remove(t.value));
                //     landingPageWrapper.classList.add(newThemeValue);
                // }
            },
            'landingPageFitFlow' // Unique pageKey for landing page theme preference
        );
    } else {
         console.warn("Landing page theme switcher or body element not found.");
         // Apply default theme manually if no switcher but themes are defined
         if (themesForLandingPage.length > 0 && bodyElement) {
            const defaultTheme = themesForLandingPage[0].value;
            themesForLandingPage.forEach(t => bodyElement.classList.remove(t.value));
            bodyElement.classList.add(defaultTheme);
            bodyElement.style.backgroundColor = 'var(--background-color)';
            bodyElement.style.color = 'var(--text-color)';
         }
    }
    
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});
