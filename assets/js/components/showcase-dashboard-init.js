import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeTabs } from './components/tabs.js';
import { initializeAccordions } from './components/accordion.js';
import { initializeImageSliders } from './components/image-slider.js';
import { initializeFileUploads } from './components/file-upload.js';

const themesForDashboard = [ /* ... your themes array, can be shared from a config.js ... */
    { value: 'theme-modern-professional', name: 'Modern & Professional' }, { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' }, { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' }, { value: 'theme-retro-funk', name: 'Retro Funk' }
];

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-showcase-area');
    const modalElementForTheme = document.getElementById('sampleModalShowcase');


    if (!themedAreaElement || !themeSwitcherElement) {
        console.error("pt-showcase-dashboard.html: Essential page elements for theme switching not found.");
        return;
    }

    // Theme switcher for this page (simpler, only themes the area and one modal)
    function applyDashboardTheme(themeValue) {
        if (!themedAreaElement) return;
        themedAreaElement.className = ''; 
        themedAreaElement.classList.add(themeValue);
        themedAreaElement.style.backgroundColor = 'var(--background-color)';
        themedAreaElement.style.color = 'var(--text-color)';

        if (modalElementForTheme) {
            themesForDashboard.forEach(t => modalElementForTheme.classList.remove(t.value));
            modalElementForTheme.classList.add(themeValue);
        }
    }
    
    themesForDashboard.forEach(theme => {
        const option = document.createElement('option'); option.value = theme.value; option.textContent = theme.name;
        themeSwitcherElement.appendChild(option);
    });
    if (themesForDashboard.length > 0) { applyDashboardTheme(themesForDashboard[0].value); }
    themeSwitcherElement.addEventListener('change', (event) => { applyDashboardTheme(event.target.value); });


    // Initialize all interactive components used on this page
    initializeModals(); // Will initialize #sampleModalShowcase and its triggers
    initializeTabs();
    initializeAccordions();
    initializeImageSliders();
    initializeFileUploads();

    // Specific button listener for the modal on this page, if not using data-modal-target
    const openModalBtnShowcase = document.getElementById('openModalBtnShowcase');
    if (openModalBtnShowcase) {
        openModalBtnShowcase.addEventListener('click', () => openModal('sampleModalShowcase'));
    }
});