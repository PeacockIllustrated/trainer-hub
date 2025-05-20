// assets/js/showcase-chunk1-init.js

// Import component initializers
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeStepper } from './components/stepper.js';

// Define themes specifically for this page's context
const themesForChunk1 = [
    { value: 'theme-modern-professional', name: 'Modern & Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel' }, // Make sure names match for display
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-chunk-area'); // Main area to theme
    const addClientModalElement = document.getElementById('addClientModal'); // Specific modal on this page

    // Guard clauses for essential elements
    if (!themedAreaElement) {
        console.error("showcase-chunk1-onboarding.html: Critical element #themed-chunk-area not found. Script cannot proceed.");
        return;
    }
    if (!themeSwitcherElement) {
        console.warn("showcase-chunk1-onboarding.html: #theme-switcher element not found. Theme switching will not be available.");
    }

    // --- Theme Application Logic for this page ---
    function applyChunk1PageTheme(themeValue) {
        if (!themedAreaElement) return; // Should be caught by above guard, but good practice

        // Apply to main themed area
        themedAreaElement.className = ''; // Clear all existing classes from the main themed area
        themedAreaElement.classList.add(themeValue); // Add the new theme class

        // Force re-evaluation of CSS variables for the main themed area
        themedAreaElement.style.backgroundColor = 'var(--background-color)';
        themedAreaElement.style.color = 'var(--text-color)';

        // Apply to the specific modal on this page
        if (addClientModalElement) {
            // Remove any of the known theme classes before adding the new one
            themesForChunk1.forEach(t => {
                if (addClientModalElement.classList.contains(t.value)) {
                    addClientModalElement.classList.remove(t.value);
                }
            });
            addClientModalElement.classList.add(themeValue);
        }
    }
    
    // --- Initialize Theme Switcher ---
    if (themeSwitcherElement) {
        themesForChunk1.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.value;
            option.textContent = theme.name;
            themeSwitcherElement.appendChild(option);
        });

        if (themesForChunk1.length > 0) {
            applyChunk1PageTheme(themesForChunk1[0].value); // Apply the first theme by default
            themeSwitcherElement.value = themesForChunk1[0].value; // Set dropdown to match
        }
        
        themeSwitcherElement.addEventListener('change', (event) => {
            applyChunk1PageTheme(event.target.value);
        });
    } else if (themesForChunk1.length > 0) {
        // If no switcher, still apply the default theme
        applyChunk1PageTheme(themesForChunk1[0].value);
    }


    // --- Initialize Interactive Components ---
    initializeStepper(); 
    initializeModals();  // This will find and initialize #addClientModal based on its .pt-modal class

    // Specific event listener for the "Add New Client" button to open its modal
    // This is needed if the button doesn't use data-modal-target, or for more control.
    const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    if (openAddClientModalBtn && addClientModalElement) { // Ensure modal element also exists
        openAddClientModalBtn.addEventListener('click', () => {
            openModal('addClientModal'); // Use the imported openModal function
        });
    }
    
    // Form submission logic for the "Add New Client" modal
    const adminAddClientForm = document.getElementById('adminAddClientForm');
    if (adminAddClientForm) {
        adminAddClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('New Client Saved (Demo)! From modular JS on Chunk1 page.');
            if (addClientModalElement) { // Ensure modal element exists before trying to close
                closeModal('addClientModal'); // Use the imported closeModal function
            }
            adminAddClientForm.reset();
        });
    }
});
