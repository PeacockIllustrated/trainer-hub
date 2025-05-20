// assets/js/showcase-chunk1-init.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeStepper } from './components/stepper.js';

const themesForChunk1 = [
    { value: 'theme-modern-professional', name: 'Modern & Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' }
];

// Making getSidebarHTML global for this demo page if theme-switcher relies on it.
// Note: This is a simplifycation. For complex apps, avoid polluting global scope.
// theme-switcher.js for this page probably doesn't need to re-render a sidebar.
window.getSidebarHTML = (logoText = "FitApp", userName = "Trainer") => {
    // This function might not be used by theme-switcher on this specific page
    // if this page doesn't have a #sidebar-container that theme-switcher updates.
    // For showcase-chunk1, the sidebar is not present.
    console.log("getSidebarHTML called on chunk1 page (likely not needed here)");
    return `<!-- No sidebar on chunk1 page -->`; 
};


document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-chunk-area'); // Main area for this page
    const addClientModalElement = document.getElementById('addClientModal'); // Specific modal

    if (!themedAreaElement) {
        console.error("showcase-chunk1-onboarding.html: Critical element #themed-chunk-area not found.");
        return;
    }
    if (!themeSwitcherElement) {
        console.warn("showcase-chunk1-onboarding.html: #theme-switcher element not found.");
        // Proceed without theme switching if switcher is missing, apply default theme.
    }

    // Initialize the theme switcher
    if (themeSwitcherElement) { // Only initialize if the switcher element exists
        initializeThemeSwitcher(themesForChunk1, themeSwitcherElement, themedAreaElement, (newThemeValue) => {
            // This is an onThemeChangeCallback, called after theme-switcher.js applies the theme to themedAreaElement.
            // We need to additionally theme the specific modal on this page.
            if (addClientModalElement) {
                themesForChunk1.forEach(t => {
                    if (addClientModalElement.classList.contains(t.value)) {
                        addClientModalElement.classList.remove(t.value);
                    }
                });
                addClientModalElement.classList.add(newThemeValue);
            }
            // No sidebar re-rendering or active link setup needed here as this page doesn't have a global sidebar
        });
    } else if (themesForChunk1.length > 0) {
        // If no switcher, but we have a themed area and themes, apply the default (first) theme.
        // Manually call a simplified apply:
        themedAreaElement.className = '';
        themedAreaElement.classList.add(themesForChunk1[0].value);
        themedAreaElement.style.backgroundColor = 'var(--background-color)';
        themedAreaElement.style.color = 'var(--text-color)';
        if (addClientModalElement) {
            themesForChunk1.forEach(t => addClientModalElement.classList.remove(t.value));
            addClientModalElement.classList.add(themesForChunk1[0].value);
        }
    }
    
    // Initialize interactive components for this page
    initializeStepper(); 
    initializeModals();  // This will set up general modal behavior for #addClientModal

    // Specific button listener for the "Add New Client" modal
    const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    if (openAddClientModalBtn && addClientModalElement) { 
        openAddClientModalBtn.addEventListener('click', () => {
            openModal('addClientModal'); // Use the imported openModal function
        });
    }
    
    const adminAddClientForm = document.getElementById('adminAddClientForm');
    if (adminAddClientForm) {
        adminAddClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('New Client Saved (Demo)! From modular JS on Chunk1 page.');
            if (addClientModalElement) {
                closeModal('addClientModal'); 
            }
            adminAddClientForm.reset();
        });
    }
});
