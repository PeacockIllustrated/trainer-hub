// assets/js/landing-page-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes

document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switcher Initialization ---
    const landingThemeSwitcherEl = document.getElementById('landingThemeSwitcher');
    
    console.log("[ThemeDebug] landingThemeSwitcherEl:", landingThemeSwitcherEl);
    console.log("[ThemeDebug] FITFLOW_THEMES_CONFIG:", FITFLOW_THEMES_CONFIG); // Use imported config
    if (typeof FITFLOW_THEMES_CONFIG !== 'undefined' && FITFLOW_THEMES_CONFIG !== null) {
        console.log("[ThemeDebug] Type of FITFLOW_THEMES_CONFIG:", Array.isArray(FITFLOW_THEMES_CONFIG) ? 'Array' : typeof FITFLOW_THEMES_CONFIG);
        console.log("[ThemeDebug] Length of FITFLOW_THEMES_CONFIG:", Array.isArray(FITFLOW_THEMES_CONFIG) ? FITFLOW_THEMES_CONFIG.length : 'N/A');
    } else {
        console.log("[ThemeDebug] FITFLOW_THEMES_CONFIG is undefined or null.");
    }

    if (landingThemeSwitcherEl) {
        if (typeof FITFLOW_THEMES_CONFIG !== 'undefined' && FITFLOW_THEMES_CONFIG !== null && Array.isArray(FITFLOW_THEMES_CONFIG) && FITFLOW_THEMES_CONFIG.length > 0) {
            initializeThemeSwitcher(
                FITFLOW_THEMES_CONFIG, // Use imported config
                landingThemeSwitcherEl,
                document.body, // Apply to body for global effect
                (themeValue, themeObject) => {
                    console.log(`Landing page theme switched to: ${themeValue}`);
                },
                'fitflowGlobalTheme' // Use the global key
            );
        } else {
            console.error("Landing Page Init: FITFLOW_THEMES_CONFIG is invalid. Cannot initialize theme switcher.");
            if (landingThemeSwitcherEl) {
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
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Google Sign-In Error:", errorCode, errorMessage, error);
            if (errorCode === 'auth/popup-closed-by-user') {
                console.log('Sign-in popup was closed by the user.');
            } else if (errorCode === 'auth/cancelled-popup-request') {
                console.log('Multiple popups were opened. Sign-in cancelled.');
            } else if (errorCode === 'auth/operation-not-allowed') {
                 alert('Error: Sign-in with Google is not enabled for this Firebase project. Please check your Firebase console (Authentication -> Sign-in method).');
            } else if (errorCode === 'auth/popup-blocked-by-browser'){
                alert('Error: Sign-in popup was blocked by your browser. Please disable your popup blocker for this site and try again.');
            } else if (errorCode === 'auth/unauthorized-domain') {
                alert('Error: This domain is not authorized for OAuth operations. Please check your Firebase console (Authentication -> Settings -> Authorized domains).');
            } else {
                alert(`Error during sign-in: ${errorMessage} (Code: ${errorCode})`);
            }
        }
    }

    if (conceptualTrainerSignUp) {
        conceptualTrainerSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                window.location.href = 'pt-admin-mvp.html';
            } else {
                signInAdminWithGoogle();
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Auth state changed: User is signed in", user);
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Go to Admin Dashboard';
                conceptualTrainerSignUp.href = 'pt-admin-mvp.html';
            }
            if (adminLoginSection) {
                adminLoginSection.style.display = 'none';
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="trainerLogoutLink" class="nav-link-like">${user.displayName} (Logout)</a>`;
                const logoutLink = document.getElementById('trainerLogoutLink');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (eL) => {
                        eL.preventDefault();
                        try {
                            await signOut(auth);
                            console.log("User signed out successfully.");
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
            console.log("Auth state changed: User is signed out");
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Get Started / Trainer Login';
                conceptualTrainerSignUp.href = '#admin-login-section';
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="navTrainerLoginTrigger" class="nav-link-like">Trainer Portal</a>`;
                const navTrainerLoginTrigger = document.getElementById('navTrainerLoginTrigger');
                if (navTrainerLoginTrigger) {
                    navTrainerLoginTrigger.addEventListener('click', (eN) => {
                        eN.preventDefault();
                        if (adminLoginSection && (adminLoginSection.style.display === 'none' || adminLoginSection.style.display === '')) {
                            adminLoginSection.style.display = 'block';
                            adminLoginSection.scrollIntoView({ behavior: 'smooth' });
                        } else { 
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

    window.onAdminSignIn = function(googleUser) {
        console.log("Legacy g-signin2 button clicked. User:", googleUser.getBasicProfile().getName());
        alert("Please use the 'Get Started / Trainer Login' button for the main Firebase sign-in experience.");
    };
});
