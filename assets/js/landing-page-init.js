// assets/js/landing-page-init.js
import { initThemeSwitcher } from './theme-switcher.js';
import { auth } from './firebase-config.js'; // Import the initialized auth service
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme Switcher for the landing page
    const landingThemeSwitcher = document.getElementById('landingThemeSwitcher');
    if (landingThemeSwitcher) {
        initThemeSwitcher(landingThemeSwitcher, 'landingPageTheme', document.body, (theme) => {
            // Optional: Add specific callbacks if parts of the landing page need manual theme updates
            // For example, if some elements are outside the main body or dynamically added
            console.log(`Landing page theme switched to: ${theme}`);
            // If using enhanced classes on header/footer for theming:
            const header = document.querySelector('.landing-header.enhanced');
            const hero = document.querySelector('.hero-section.enhanced');
            const ctaSection = document.querySelector('.cta-section.enhanced');
            const featuresSection = document.querySelector('.features-section.enhanced');
            const adminLoginChunk = document.querySelector('.chunk-section.enhanced#admin-login-section');
            const footer = document.querySelector('.landing-footer.enhanced');
            const adminSigninLink = document.querySelector('.admin-signin-link.enhanced');

            // This assumes your theme CSS files directly target .landing-enhanced or its children
            // with theme-specific variables. If they rely on a class on body, this is fine.
            // If specific elements need a theme class *added/removed*, you'd do that here.
            // For now, assuming CSS variables cascade correctly.
        });
    }

    // Set current year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Firebase Authentication Logic ---
    const conceptualTrainerSignUp = document.getElementById('conceptualTrainerSignUp'); // Main "Get Started" CTA
    const adminLoginSection = document.getElementById('admin-login-section'); // Section with Google Sign-in button
    const adminLoginLinkPlaceholder = document.getElementById('adminLoginLinkPlaceholder'); // Nav link "Trainer Portal"
    const adminDemoAppLink = document.querySelector('a[href="pt-admin-mvp.html"]'); // "Explore Admin Demo App" link

    async function signInAdminWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Firebase Google Sign-In Success for Admin!");
            console.log("User:", user);

            // UI updates will be handled by onAuthStateChanged, but we can log success here.
            alert(`Welcome, ${user.displayName}! You are signed in. (Admin flow)`);
            // No direct redirect here; onAuthStateChanged will handle UI and potentially app state.

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Google Sign-In Error:", errorCode, errorMessage);
            if (errorCode === 'auth/popup-closed-by-user') {
                alert('Sign-in popup was closed. Please try again if you wish to sign in.');
            } else {
                alert(`Error during sign-in: ${errorMessage}`);
            }
        }
    }

    // Event listener for the main "Get Started / Trainer Login" CTA button
    if (conceptualTrainerSignUp) {
        conceptualTrainerSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                // If user is already signed in, this button acts as "Go to Admin Dashboard"
                // TODO: Check if user is 'trainer' role from Firestore
                window.location.href = 'pt-admin-mvp.html';
            } else {
                // If user is not signed in, trigger Google Sign-In
                signInAdminWithGoogle();
            }
        });
    }

    // Handle Auth State Changes (Login/Logout)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("Auth state changed: User is signed in", user);

            if (conceptualTrainerSignUp) {
                conceptualTrainerSignUp.textContent = 'Go to Admin Dashboard';
                conceptualTrainerSignUp.href = 'pt-admin-mvp.html'; // Update href for direct navigation
            }
            if (adminLoginSection) {
                adminLoginSection.style.display = 'none'; // Hide the Google Sign-In button section
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="trainerLogoutLink" class="nav-link-like">${user.displayName} (Logout)</a>`;
                const logoutLink = document.getElementById('trainerLogoutLink');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try {
                            await signOut(auth);
                            console.log("User signed out successfully.");
                            alert("You have been signed out.");
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
                conceptualTrainerSignUp.href = '#admin-login-section'; // Reset href
            }
            if (adminLoginSection) {
                 // Make the section visible again if it was hidden,
                 // or set its default display state if you want it always visible when logged out.
                 // For now, let's ensure it's accessible if the CTA links to it.
                 // The CTA click might show it, or the nav link might.
            }
            if (adminLoginLinkPlaceholder) {
                adminLoginLinkPlaceholder.innerHTML = `<a href="#" id="navTrainerLoginTrigger" class="nav-link-like">Trainer Portal</a>`;
                const navTrainerLoginTrigger = document.getElementById('navTrainerLoginTrigger');
                if (navTrainerLoginTrigger) {
                    navTrainerLoginTrigger.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (adminLoginSection) { // Show the section with the Google button if it exists
                            adminLoginSection.style.display = 'block';
                            adminLoginSection.scrollIntoView({ behavior: 'smooth' });
                            // Optionally, directly trigger sign-in:
                            // signInAdminWithGoogle();
                        } else { // Fallback if the section is removed, directly trigger sign-in
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

    // Legacy Google Sign-In (g-signin2) - can be phased out
    // This function needs to be globally available if the g-signin2 button is still in HTML
    window.onAdminSignIn = function(googleUser) {
        // This is for the <div class="g-signin2"></div> button if it's still used.
        // It's better to use our custom button and the Firebase SDK's signInWithPopup.
        console.log("Legacy g-signin2 button clicked. User details:", googleUser.getBasicProfile().getName());
        alert("Please use the 'Get Started / Trainer Login' button for the new Firebase sign-in experience.");
        // To integrate this properly, you'd get the ID token and use signInWithCredential with Firebase.
        // const id_token = googleUser.getAuthResponse().id_token;
        // const credential = GoogleAuthProvider.credential(id_token);
        // auth.signInWithCredential(credential).then(...).catch(...);
        // For simplicity, we're focusing on signInWithPopup for now.
    };

    // Initial setup for the conceptualTrainerSignUp button's behavior
    // (if it's also meant to toggle the adminLoginSection visibility when not logged in)
    if (conceptualTrainerSignUp && adminLoginSection && !auth.currentUser) {
        const oldConceptualSignUpBehavior = (e) => {
            // This listener is for the case where the button should *also* show the section
            // before sign-in is attempted by a click on the g-signin2 button within that section.
            // Since our main CTA now directly triggers Firebase sign-in, this might be redundant
            // or only needed if we want to explicitly show the section first.
            if (!auth.currentUser) { // Only toggle if not logged in
                 e.preventDefault(); // Prevent #admin-login-section in URL
                adminLoginSection.style.display = adminLoginSection.style.display === 'none' || adminLoginSection.style.display === '' ? 'block' : 'none';
                if (adminLoginSection.style.display === 'block') {
                    adminLoginSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // If logged in, the other event listener on conceptualTrainerSignUp handles navigation.
        };
        // If #conceptualTrainerSignUp should ONLY trigger Firebase sign-in,
        // then this specific toggle logic is not needed on it.
        // The current setup is: #conceptualTrainerSignUp directly calls signInAdminWithGoogle() if logged out.
        // The #adminLoginSection visibility can be handled by the #navTrainerLoginTrigger instead.
    }


    // Ensure scripts from platform.js (for g-signin2) are loaded if that button is still present.
    // The <script src="https://apis.google.com/js/platform.js" async defer></script> in index.html handles this.

});
