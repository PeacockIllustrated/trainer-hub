// assets/js/landing-page-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const FITFLOW_THEMES = [
    { value: 'theme-modern-professional', name: 'Modern Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe & Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-urban-grit', name: 'Urban Grit' },
    { value: 'theme-tech-data', name: 'Tech & Data' },
    { value: 'theme-playful-pop', name: 'Playful Pop' }
];

document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switcher Initialization ---
    const landingThemeSwitcherEl = document.getElementById('landingThemeSwitcher');
    
    // Debugging logs for theme switcher elements and data
    console.log("[ThemeDebug] landingThemeSwitcherEl:", landingThemeSwitcherEl);
    console.log("[ThemeDebug] FITFLOW_THEMES:", FITFLOW_THEMES);
    if (typeof FITFLOW_THEMES !== 'undefined' && FITFLOW_THEMES !== null) {
        console.log("[ThemeDebug] Type of FITFLOW_THEMES:", Array.isArray(FITFLOW_THEMES) ? 'Array' : typeof FITFLOW_THEMES);
        console.log("[ThemeDebug] Length of FITFLOW_THEMES:", Array.isArray(FITFLOW_THEMES) ? FITFLOW_THEMES.length : 'N/A');
    } else {
        console.log("[ThemeDebug] FITFLOW_THEMES is undefined or null.");
    }

    if (landingThemeSwitcherEl) {
        if (typeof FITFLOW_THEMES !== 'undefined' && FITFLOW_THEMES !== null && Array.isArray(FITFLOW_THEMES) && FITFLOW_THEMES.length > 0) {
                 initializeThemeSwitcher(
                FITFLOW_THEMES,
                landingThemeSwitcherEl,
                document.body,
                (themeValue, themeObject) => {
                    console.log(`Landing page theme switched to: ${themeValue}`);
                },
                'fitflowGlobalTheme' // <<< Use the global key
            );
        } else {
            console.error("Landing Page Init: FITFLOW_THEMES is undefined, null, not an array, or empty. Cannot initialize theme switcher.");
            if (landingThemeSwitcherEl) { // Hide selector if themes are missing
                landingThemeSwitcherEl.style.display = 'none';
                const label = document.querySelector('label[for="landingThemeSwitcher"]');
                if (label) label.style.display = 'none';
            }
        }
    } else {
        console.warn("Landing Page Init: Theme switcher select element #landingThemeSwitcher not found.");
    }

    // --- Set current year in footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Firebase Authentication Logic ---
    const conceptualTrainerSignUp = document.getElementById('conceptualTrainerSignUp');
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminLoginLinkPlaceholder = document.getElementById('adminLoginLinkPlaceholder');
    const adminDemoAppLink = document.querySelector('a[href="pt-admin-mvp.html"]');

    async function signInAdminWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Firebase Google Sign-In Success for Admin!");
            console.log("User:", user);
            // UI updates are primarily handled by onAuthStateChanged
            // alert(`Welcome, ${user.displayName}! You are signed in. (Admin flow)`); // Optional: Can be removed if onAuthStateChanged handles UI promptly
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Google Sign-In Error:", errorCode, errorMessage, error);
            
            if (errorCode === 'auth/popup-closed-by-user') {
                console.log('Sign-in popup was closed by the user.'); // No alert needed
            } else if (errorCode === 'auth/cancelled-popup-request') {
                console.log('Multiple popups were opened. Sign-in cancelled.'); // No alert
            } else if (errorCode === 'auth/operation-not-allowed') {
                 alert('Error: Sign-in with Google is not enabled for this Firebase project. Please check your Firebase console (Authentication -> Sign-in method).');
            } else if (errorCode === 'auth/popup-blocked-by-browser'){
                alert('Error: Sign-in popup was blocked by your browser. Please disable your popup blocker for this site and try again.');
            } else if (errorCode === 'auth/unauthorized-domain') {
                alert('Error: This domain is not authorized for OAuth operations. Please check your Firebase console (Authentication -> Settings -> Authorized domains).');
            }
            else {
                alert(`Error during sign-in: ${errorMessage} (Code: ${errorCode})`);
            }
        }
    }

    if (conceptualTrainerSignUp) {
        conceptualTrainerSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                // TODO: Eventually, check if user has 'trainer' role from Firestore before redirecting
                window.location.href = 'pt-admin-mvp.html';
            } else {
                signInAdminWithGoogle();
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("Auth state changed: User is signed in", user);
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Go to Admin Dashboard';
                conceptualTrainerSignUp.href = 'pt-admin-mvp.html';
            }
            if (adminLoginSection) { // Hide the separate login section if user is logged in
                adminLoginSection.style.display = 'none';
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="trainerLogoutLink" class="nav-link-like">${user.displayName} (Logout)</a>`;
                const logoutLink = document.getElementById('trainerLogoutLink');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (eL) => { // Renamed 'e' to 'eL' to avoid conflict
                        eL.preventDefault();
                        try {
                            await signOut(auth);
                            console.log("User signed out successfully.");
                            // UI will be updated by this onAuthStateChanged listener firing again with user = null
                        } catch (error) {
                            console.error("Sign out error", error);
                            alert("Error signing out. Please try again.");
                        }
                    });
                }
            }
            if (adminDemoAppLink) {
                adminDemoAppLink.textContent = `Welcome ${user.displayName}! Go to Admin App →`;
            }
        } else {
            // User is signed out
            console.log("Auth state changed: User is signed out");
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Get Started / Trainer Login';
                conceptualTrainerSignUp.href = '#admin-login-section'; // Link to the section
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="navTrainerLoginTrigger" class="nav-link-like">Trainer Portal</a>`;
                const navTrainerLoginTrigger = document.getElementById('navTrainerLoginTrigger');
                if (navTrainerLoginTrigger) {
                    navTrainerLoginTrigger.addEventListener('click', (eN) => { // Renamed 'e' to 'eN'
                        eN.preventDefault();
                        // If adminLoginSection exists and is hidden, show it. Otherwise, trigger sign-in.
                        if (adminLoginSection && (adminLoginSection.style.display === 'none' || adminLoginSection.style.display === '')) {
                            adminLoginSection.style.display = 'block';
                            adminLoginSection.scrollIntoView({ behavior: 'smooth' });
                        } else { 
                            // If section doesn't exist or is already visible, directly attempt sign-in
                            signInAdminWithGoogle();
                        }
                    });
                }
            }
            if (adminDemoAppLink) {
                adminDemoAppLink.textContent = 'Explore Admin Demo App →';
            }
        }
    });

    // Legacy Google Sign-In (g-signin2 button) - can be phased out
    window.onAdminSignIn = function(googleUser) {
        console.log("Legacy g-signin2 button clicked. User:", googleUser.getBasicProfile().getName());
        alert("Please use the 'Get Started / Trainer Login' button for the main Firebase sign-in experience.");
        // To properly integrate, you would get the ID token and use signInWithCredential with Firebase.
        // const id_token = googleUser.getAuthResponse().id_token;
        // const credential = GoogleAuthProvider.credential(id_token);
        // auth.signInWithCredential(credential).then(...).catch(...);
    };
});
