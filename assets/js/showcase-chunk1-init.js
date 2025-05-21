// assets/js/showcase-chunk1-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeStepper } from './components/stepper.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    // Similar to showcase-dashboard, target body for global consistency.
    const themedAreaElement = document.getElementById('themed-chunk-area'); // Could be document.body
    const bodyToTheme = document.body; // Target body
    const addClientModalElement = document.getElementById('addClientModal'); 

    if (!themeSwitcherElement) {
        console.warn("Showcase Chunk1: #theme-switcher element not found. Applying default theme.");
        if (FITFLOW_THEMES_CONFIG.length > 0) {
            const defaultTheme = FITFLOW_THEMES_CONFIG[0];
            bodyToTheme.classList.add(defaultTheme.value);
            if (addClientModalElement) {
                FITFLOW_THEMES_CONFIG.forEach(t => addClientModalElement.classList.remove(t.value));
                addClientModalElement.classList.add(defaultTheme.value);
            }
        }
    } else {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG, 
            themeSwitcherElement, 
            bodyToTheme, // Target document.body
            (newThemeValue, currentThemeObject) => {
                console.log(`Showcase Chunk1 theme changed to ${newThemeValue}`);
                if (addClientModalElement) {
                    FITFLOW_THEMES_CONFIG.forEach(t => {
                        if (addClientModalElement.classList.contains(t.value)) {
                            addClientModalElement.classList.remove(t.value);
                        }
                    });
                    addClientModalElement.classList.add(newThemeValue);
                }
            },
            'fitflowGlobalTheme' // Use global key
        );
    }
    
    initializeStepper(); 
    initializeModals();

    const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    if (openAddClientModalBtn && addClientModalElement) { 
        openAddClientModalBtn.addEventListener('click', () => {
            openModal(addClientModalElement.id); 
        });
    }
    
    const adminAddClientForm = document.getElementById('adminAddClientForm');
    if (adminAddClientForm && addClientModalElement) {
        adminAddClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('New Client Saved (Demo)! From modular JS on Chunk1 page.');
            closeModal(addClientModalElement.id); 
            adminAddClientForm.reset();
        });
    }
});
