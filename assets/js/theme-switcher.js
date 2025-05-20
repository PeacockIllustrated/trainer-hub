// assets/js/theme-switcher.js

/**
 * Initializes the theme switcher dropdown and handles theme changes.
 * @param {Array} themesArray - Array of theme objects {value, name, sidebarLogo?, sidebarUser?}
 * @param {HTMLElement} themeSwitcherSelectElement - The select element for theme switching.
 * @param {HTMLElement} areaToThemeElement - The main DOM element to apply the theme class to.
 * @param {Function} [onThemeChangeCallback] - Optional callback function after a theme is applied.
 */
export function initializeThemeSwitcher(themesArray, themeSwitcherSelectElement, areaToThemeElement, onThemeChangeCallback) {
    if (!themesArray || !themeSwitcherSelectElement || !areaToThemeElement) {
        console.error("Theme switcher initialization failed: Missing required elements or themes array.");
        console.log("Debug Info:", { themesArray, themeSwitcherSelectElement, areaToThemeElement });
        return;
    }

    // Populate the select dropdown
    themesArray.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.name;
        themeSwitcherSelectElement.appendChild(option);
    });

    // Inner function to apply the actual theme
    function applyTheme(themeValue) {
        if (!areaToThemeElement) {
            console.error("applyTheme error: areaToThemeElement is undefined or null within applyTheme.");
            return;
        }

        // Apply theme to the main designated area
        areaToThemeElement.className = ''; // Clear all existing classes from the target area
        areaToThemeElement.classList.add(themeValue); // Add the new theme class

        // Force re-evaluation of CSS variables from the new theme class for the main area
        areaToThemeElement.style.backgroundColor = 'var(--background-color)';
        areaToThemeElement.style.color = 'var(--text-color)';

        // --- Logic for elements that might be unique to index.html or specific pages ---
        // These should ideally be handled by the onThemeChangeCallback if they vary per page.
        
        // Example: Theme the global mobile nav if it exists
        const mobileNavGlobalContainer = document.getElementById('mobile-nav-global-container');
        if (mobileNavGlobalContainer && mobileNavGlobalContainer.firstChild) {
            mobileNavGlobalContainer.firstChild.className = 'pt-mobile-nav-banner'; // Reset base class
            mobileNavGlobalContainer.firstChild.classList.add(themeValue); // Apply current theme
        }

        // Example: Update sidebar content if it exists and getSidebarHTML is available
        const sidebarContainer = document.getElementById('sidebar-container');
        const currentThemeObj = themesArray.find(t => t.value === themeValue);
        if (currentThemeObj && sidebarContainer && typeof window.getSidebarHTML === 'function') {
            sidebarContainer.innerHTML = window.getSidebarHTML(currentThemeObj.sidebarLogo, currentThemeObj.sidebarUser);
        }
        // --- End of page-specific logic example ---


        // Call the optional callback if provided, passing the new theme value
        if (onThemeChangeCallback && typeof onThemeChangeCallback === 'function') {
            onThemeChangeCallback(themeValue);
        }
    }

    // Apply the first theme initially if themes exist
    if (themesArray.length > 0) {
        applyTheme(themesArray[0].value);
        themeSwitcherSelectElement.value = themesArray[0].value; // Set dropdown to current theme
    }

    // Add event listener to the select dropdown
    themeSwitcherSelectElement.addEventListener('change', (event) => {
        applyTheme(event.target.value);
    });

    // Optionally return the applyTheme function if it needs to be called externally
    // (e.g., if another part of the JS needs to programmatically change the theme)
    return applyTheme;
}
