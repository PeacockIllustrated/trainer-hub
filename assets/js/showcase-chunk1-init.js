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

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-chunk-area'); 
    const addClientModalElement = document.getElementById('addClientModal'); 

    if (!themedAreaElement) {
        console.error("showcase-chunk1-onboarding.html: Critical element #themed-chunk-area not found.");
        return;
    }

    if (!themeSwitcherElement) {
        console.warn("showcase-chunk1-onboarding.html: #theme-switcher element not found. Applying default theme if possible.");
        if (themesForChunk1.length > 0) {
            themedAreaElement.classList.add(themesForChunk1[0].value);
            themedAreaElement.style.backgroundColor = 'var(--background-color)';
            themedAreaElement.style.color = 'var(--text-color)';
            if (addClientModalElement) {
                themesForChunk1.forEach(t => addClientModalElement.classList.remove(t.value));
                addClientModalElement.classList.add(themesForChunk1[0].value);
            }
        }
    } else {
        initializeThemeSwitcher(
            themesForChunk1, 
            themeSwitcherElement, 
            themedAreaElement,
            (newThemeValue, currentThemeObject) => { // onThemeChangeCallback
                // Theme the specific modal on this page
                if (addClientModalElement) {
                    themesForChunk1.forEach(t => {
                        if (addClientModalElement.classList.contains(t.value)) {
                            addClientModalElement.classList.remove(t.value);
                        }
                    });
                    addClientModalElement.classList.add(newThemeValue);
                }
            }
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
