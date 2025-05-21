// assets/js/landing-page-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';
// Import db, serverTimestamp, and Firestore functions
import { auth, db, serverTimestamp } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes

const LANDING_PAGE_GLOBAL_THEME_KEY = 'fitflowGlobalTheme';

document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switcher Initialization ---
    const landingThemeSwitcherEl = document.getElementById('landingThemeSwitcher');
    
    // Debugging logs for theme switcher elements and data
    console.log("[ThemeDebug] landingThemeSwitcherEl:", landingThemeSwitcherEl);
    console.log("[ThemeDebug] FITFLOW_THEMES_CONFIG:", FITFLOW_THEMES_CONFIG);
    if (typeof FITFLOW_THEMES_CONFIG !== 'undefined' && FITFLOW_THEMES_CONFIG !== null) {
        console.log("[ThemeDebug] Type of FITFLOW_THEMES_CONFIG:", Array.isArray(FITFLOW_THEMES_CONFIG) ? 'Array' : typeof FITFLOW_THEMES_CONFIG);
        console.log("[ThemeDebug] Length of FITFLOW_THEMES_CONFIG:", Array.isArray(FITFLOW_THEMES_CONFIG) ? FITFLOW_THEMES_CONFIG.length : 'N/A');
    } else {
        console.log("[ThemeDebug] FITFLOW_THEMES_CONFIG is undefined or null.");
    }

    if (landingThemeSwitcherEl) {
        if (typeof FITFLOW_THEMES_CONFIG !== 'undefined' && FITFLOW_THEMES_CONFIG !== null && Array.isArray(FITFLOW_THEMES_CONFIG) && FITFLOW_THEMES_CONFIG.length > 0) {
            initializeThemeSwitcher(
                FITFLOW_THEMES_CONFIG,
                landingThemeSwitcherEl,
                document.body, // Apply to body for global effect
                (themeValue, themeObject) => {
                    console.log(`Landing page theme switched to: ${themeValue}`);
                },
                LANDING_PAGE_GLOBAL_THEME_KEY // Use the global key
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

    async function handleTrainerSignIn() { // Renamed for clarity
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Firebase Google Sign-In Success for Trainer attempt!");

            // Check user role in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === "trainer") {
                    console.log("Existing trainer found:", userData.displayName || user.displayName);
                    // Redirect to admin dashboard
                    window.location.href = 'pt-admin-mvp.html';
                } else if (userData.role === "client") {
                    alert("This Google account is registered as a client. Please use the client login portal. You will be signed out from trainer login.");
                    await signOut(auth); // Sign them out as they tried trainer login
                } else {
                    alert("Your account has an unrecognized role. Please contact support. You will be signed out.");
                    await signOut(auth);
                }
            } else {
                // New user - Sign them up as a trainer
                console.log("New user. Creating trainer profile in Firestore for:", user.displayName || user.email);
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL, // Store photo URL from Google
                    role: "trainer",
                    createdAt: serverTimestamp() // Firestore server timestamp
                });
                console.log("New trainer profile created successfully.");
                // Redirect to admin dashboard
                window.location.href = 'pt-admin-mvp.html';
            }

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
                // If already signed in, and this button is "Go to Admin Dashboard", navigate
                // The role check is handled by pt-admin-mvp.html's auth guard upon load.
                window.location.href = 'pt-admin-mvp.html';
            } else {
                handleTrainerSignIn(); // Initiate trainer sign-in flow
            }
        });
    }

    // Auth State Change Listener: Updates UI based on login status on the landing page
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Landing Page: Auth state changed: User is signed in.", user.displayName || user.email);
            
            // Update main CTA button
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Go to Admin Dashboard';
                conceptualTrainerSignUp.href = 'pt-admin-mvp.html'; // Direct link for quick navigation
            }

            // Update nav link for Trainer Portal
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="trainerLogoutLink" class="nav-link-like">${user.displayName || user.email} (Logout)</a>`;
                const logoutLink = document.getElementById('trainerLogoutLink');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (eL) => {
                        eL.preventDefault();
                        try {
                            await signOut(auth);
                            console.log("User signed out successfully from landing page.");
                            // onAuthStateChanged will fire again with user=null, updating UI
                        } catch (error) {
                            console.error("Sign out error from landing page:", error);
                            alert("Error signing out. Please try again.");
                        }
                    });
                }
            }

            // Update "Explore Admin Demo App" link
            if (adminDemoAppLink) {
                adminDemoAppLink.textContent = `Welcome ${user.displayName || user.email}! Go to Admin App →`;
            }

            // Hide the separate login section if user is logged in
            if (adminLoginSection) {
                adminLoginSection.style.display = 'none';
            }

        } else {
            console.log("Landing Page: Auth state changed: User is signed out.");
            
            // Reset main CTA button
            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Get Started / Trainer Login';
                conceptualTrainerSignUp.href = '#admin-login-section'; // Link back to the login section (or trigger sign-in)
            }

            // Reset nav link for Trainer Portal
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="navTrainerLoginTrigger" class="nav-link-like">Trainer Portal</a>`;
                const navTrainerLoginTrigger = document.getElementById('navTrainerLoginTrigger');
                if (navTrainerLoginTrigger) {
                    navTrainerLoginTrigger.addEventListener('click', (eN) => {
                        eN.preventDefault();
                        // Clicking this now attempts to show the login section or directly sign in
                        if (adminLoginSection && (adminLoginSection.style.display === 'none' || adminLoginSection.style.display === '')) {
                            adminLoginSection.style.display = 'block';
                            adminLoginSection.scrollIntoView({ behavior: 'smooth' });
                        } else { 
                            // If section is already visible or doesn't exist, directly attempt sign-in
                            handleTrainerSignIn();
                        }
                    });
                }
            }

            // Reset "Explore Admin Demo App" link
            if (adminDemoAppLink) {
                adminDemoAppLink.textContent = 'Explore Admin Demo App →';
            }

            // Ensure the adminLoginSection is visible if it's the intended path (or hidden by default)
            // It's set to 'none' when logged in, so here it can be default.
        }
    });

    // Legacy Google Sign-In (g-signin2 button) - This will no longer be the primary sign-in method.
    // It's still here to prevent errors if the HTML element is present, but it directs users to the main button.
    window.onAdminSignIn = function(googleUser) {
        console.log("Legacy g-signin2 button clicked. User:", googleUser.getBasicProfile().getName());
        alert("Please use the 'Get Started / Trainer Login' button for the main Firebase sign-in experience.");
        // If you remove the g-signin2 div from HTML, you can remove this function entirely.
    };
});
