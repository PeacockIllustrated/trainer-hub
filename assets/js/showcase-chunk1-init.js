// assets/js/showcase-chunk1-init.js
import { initializeThemeSwitcher } from './theme-switcher.js'; // USING THE MODULE
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeStepper } from './components/stepper.js';

// This themes array is passed to initializeThemeSwitcher
const themesForChunk1 = [
    { value: 'theme-modern-professional', name: 'Modern & Professional', /* other theme-specific data if needed by theme-switcher.js */ },
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

// Make HTML generating functions global if theme-switcher.js relies on them for sidebar updates
// This is a workaround; ideally, theme-switcher.js wouldn't re-render HTML, only apply classes.
window.getSidebarHTML = (logoText = "FitApp", userName = "Trainer") => {
    // ... your getSidebarHTML function content ...
    return `
    <aside class="pt-sidebar">
        <div class="pt-sidebar__header"><h1 class="pt-sidebar__logo">${logoText}</h1></div>
        <nav class="pt-sidebar__nav"><ul class="pt-sidebar__nav-list">
            <li class="pt-sidebar__nav-item"><a href="#dashboard" class="pt-sidebar__nav-link is-active"><span class="pt-sidebar__nav-icon">D</span><span class="pt-sidebar__nav-text">Dashboard</span></a></li>
            {/* ... other nav items ... */}
        </ul></nav>
        <div class="pt-sidebar__footer"><a href="#profile" class="pt-sidebar__user-profile"><span class="pt-sidebar__user-avatar">${userName.charAt(0)}</span><span class="pt-sidebar__user-name">${userName}</span></a><a href="#logout" class="pt-sidebar__logout-link"><span class="pt-sidebar__nav-icon">→</span><span class="pt-sidebar__nav-text">Logout</span></a></div>
    </aside>`;
};


document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    // For showcase-chunk1-onboarding.html, the main themed area is #themed-chunk-area
    const themedAreaElement = document.getElementById('themed-chunk-area'); 
    const addClientModalElement = document.getElementById('addClientModal');

    if (!themedAreaElement || !themeSwitcherElement) {
        console.error("showcase-chunk1-onboarding.html: Essential page elements for theme switching not found.");
        return;
    }

    // Initialize the theme switcher using the imported function
    const applyTheme = initializeThemeSwitcher(themesForChunk1, themeSwitcherElement, themedAreaElement, (newThemeValue) => {
        // This is an onThemeChangeCallback, executed after the theme is applied by theme-switcher.js
        // We need to additionally theme the specific modal on this page
        if (addClientModalElement) {
            themesForChunk1.forEach(t => addClientModalElement.classList.remove(t.value));
            addClientModalElement.classList.add(newThemeValue);
        }
        // If theme-switcher.js re-renders sidebar, active links need re-setup
        // setupActiveLinkSwitcher(); // Assuming you have this function for active links
    });
    
    // If the initial theme application by theme-switcher.js doesn't cover the modal, do it here
    if (themesForChunk1.length > 0 && addClientModalElement) {
        const initialTheme = themesForChunk1[0].value;
        themesForChunk1.forEach(t => addClientModalElement.classList.remove(t.value));
        addClientModalElement.classList.add(initialTheme);
    }


    // Initialize other components specific to this page
    initializeStepper(); 
    initializeModals();

    const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    if (openAddClientModalBtn) {
        openAddClientModalBtn.addEventListener('click', () => {
            openModal('addClientModal'); 
        });
    }
    
    const adminAddClientForm = document.getElementById('adminAddClientForm');
    if (adminAddClientForm) {
        adminAddClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('New Client Saved (Demo)! From modular JS on Chunk1 page.');
            closeModal('addClientModal');
            adminAddClientForm.reset();
        });
    }
});
