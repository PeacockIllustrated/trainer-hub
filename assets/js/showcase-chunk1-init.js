import { initializeThemeSwitcher } from './theme-switcher.js'; // Assuming you want theme switching here too
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { initializeStepper } from './components/stepper.js';

const themesForChunk1 = [ /* ... your themes array ... */
    { value: 'theme-modern-professional', name: 'Modern & Professional' }, { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' }, { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' }, { value: 'theme-retro-funk', name: 'Retro Funk' }
];

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-chunk-area');
    const addClientModalElement = document.getElementById('addClientModal'); // Specific modal for this page

    if (!themedAreaElement || !themeSwitcherElement) {
        console.error("showcase-chunk1-onboarding.html: Essential page elements for theme switching not found.");
        return;
    }

    // Simplified theme application for this page
    function applyChunk1Theme(themeValue) {
        if (!themedAreaElement) return;
        themedAreaElement.className = ''; 
        themedAreaElement.classList.add(themeValue);
        themedAreaElement.style.backgroundColor = 'var(--background-color)';
        themedAreaElement.style.color = 'var(--text-color)';

        if (addClientModalElement) {
            themesForChunk1.forEach(t => addClientModalElement.classList.remove(t.value));
            addClientModalElement.classList.add(themeValue);
        }
    }
    
    themesForChunk1.forEach(theme => {
        const option = document.createElement('option'); option.value = theme.value; option.textContent = theme.name;
        themeSwitcherElement.appendChild(option);
    });
    if (themesForChunk1.length > 0) { applyChunk1Theme(themesForChunk1[0].value); }
    themeSwitcherElement.addEventListener('change', (event) => { applyChunk1Theme(event.target.value); });


    // Initialize components specific to this page
    initializeStepper(); 
    initializeModals();  // This will find and initialize #addClientModal if it has .pt-modal

    // Specific event listener for the "Add New Client" button
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