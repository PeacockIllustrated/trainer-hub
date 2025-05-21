// assets/js/showcase-dashboard-init.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal } from './components/modal.js'; // closeModal might not be used directly here
import { initializeTabs } from './components/tabs.js';
import { initializeAccordions } from './components/accordion.js';
import { initializeImageSliders } from './components/image-slider.js';
import { initializeFileUploads } from './components/file-upload.js';

const themesForDashboard = [ 
    { value: 'theme-modern-professional', name: 'Modern & Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' }, 
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-urban-grit', name: 'Urban Grit' },
    { value: 'theme-playful-pop', name: 'Playful Pop' },
    { value: 'theme-tech-data', name: 'Tech Data' }
];

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-showcase-area');
    const modalElementForTheme = document.getElementById('sampleModalShowcase'); // Specific modal for this page

    if (!themedAreaElement) {
        console.error("pt-showcase-dashboard.html: Essential page element #themed-showcase-area not found.");
        return;
    }
    if (!themeSwitcherElement) { // If switcher isn't on the page, still try to apply a default theme to area + modal
        console.warn("pt-showcase-dashboard.html: #theme-switcher element not found. Applying default theme if possible.");
        if (themesForDashboard.length > 0) {
            themedAreaElement.classList.add(themesForDashboard[0].value);
            themedAreaElement.style.backgroundColor = 'var(--background-color)';
            themedAreaElement.style.color = 'var(--text-color)';
            if (modalElementForTheme) {
                themesForDashboard.forEach(t => modalElementForTheme.classList.remove(t.value));
                modalElementForTheme.classList.add(themesForDashboard[0].value);
            }
        }
    } else {
        initializeThemeSwitcher(
            themesForDashboard,
            themeSwitcherElement,
            themedAreaElement,
            (newThemeValue, currentThemeObject) => { // onThemeChangeCallback
                // Theme the specific modal on this page
                if (modalElementForTheme) {
                    themesForDashboard.forEach(t => { // Remove all known theme classes
                        if (modalElementForTheme.classList.contains(t.value)) {
                            modalElementForTheme.classList.remove(t.value);
                        }
                    });
                    modalElementForTheme.classList.add(newThemeValue); // Add current theme
                }
            }
        );
    }

    // Initialize all interactive components used on this page
    initializeModals(); 
    initializeTabs();
    initializeAccordions();
    initializeImageSliders();
    initializeFileUploads();

    // Specific button listener for the modal on this page, if not using data-modal-target
    const openModalBtnShowcase = document.getElementById('openModalBtnShowcase');
    if (openModalBtnShowcase && modalElementForTheme) { // ensure modal exists too
        openModalBtnShowcase.addEventListener('click', () => openModal(modalElementForTheme.id));
    }
});
