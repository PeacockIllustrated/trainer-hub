// assets/js/showcase-dashboard-init.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal } from './components/modal.js';
import { initializeTabs } from './components/tabs.js';
import { initializeAccordions } from './components/accordion.js';
import { initializeImageSliders } from './components/image-slider.js';
import { initializeFileUploads } from './components/file-upload.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    // For showcase pages, we might theme a specific area OR the whole body.
    // If we want the page header (outside themed-showcase-area) to also reflect the theme,
    // then document.body is the better target for the theme class.
    // The 'themed-showcase-area' can still derive its styles from CSS vars on the body.
    const themedAreaElement = document.getElementById('themed-showcase-area'); // Could be document.body
    const bodyToTheme = document.body; // Let's target body for global consistency
    const modalElementForTheme = document.getElementById('sampleModalShowcase');

    if (!themeSwitcherElement) {
        console.warn("Showcase Dashboard: #theme-switcher element not found. Applying default theme.");
        if (FITFLOW_THEMES_CONFIG.length > 0) {
            const defaultTheme = FITFLOW_THEMES_CONFIG[0];
            bodyToTheme.classList.add(defaultTheme.value);
            // themedAreaElement might not need direct class if body is themed and CSS vars are used
            if (modalElementForTheme) {
                FITFLOW_THEMES_CONFIG.forEach(t => modalElementForTheme.classList.remove(t.value));
                modalElementForTheme.classList.add(defaultTheme.value);
            }
        }
    } else {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG,
            themeSwitcherElement,
            bodyToTheme, // Target document.body for theme class
            (newThemeValue, currentThemeObject) => {
                console.log(`Showcase Dashboard theme changed to ${newThemeValue}`);
                if (modalElementForTheme) {
                    FITFLOW_THEMES_CONFIG.forEach(t => {
                        if (modalElementForTheme.classList.contains(t.value)) {
                            modalElementForTheme.classList.remove(t.value);
                        }
                    });
                    modalElementForTheme.classList.add(newThemeValue);
                }
                // If themedAreaElement is different from bodyToTheme and needs its own class (less common with CSS vars)
                // you would handle it here too.
            },
            'fitflowGlobalTheme' // Use global key
        );
    }

    initializeModals(); 
    initializeTabs();
    initializeAccordions();
    initializeImageSliders();
    initializeFileUploads();

    const openModalBtnShowcase = document.getElementById('openModalBtnShowcase');
    if (openModalBtnShowcase && modalElementForTheme) {
        openModalBtnShowcase.addEventListener('click', () => openModal(modalElementForTheme.id));
    }
});
