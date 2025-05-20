// assets/js/theme-switcher.js

/**
 * Initializes the theme switcher dropdown and handles theme changes.
 * @param {Array} themesArray - Array of theme objects {value, name, ... any other data needed by callback}
 * @param {HTMLElement} themeSwitcherSelectElement - The <select> element for theme switching.
 * @param {HTMLElement} areaToThemeElement - The main DOM element to apply the theme class to.
 * @param {Function} [onThemeChangeCallback] - Optional callback function after a theme is applied, receives (themeValue, currentThemeObject).
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
        // Clear only known theme classes to preserve other structural classes if any
        themesArray.forEach(t => areaToThemeElement.classList.remove(t.value));
        areaToThemeElement.classList.add(themeValue); 

        // Force re-evaluation of CSS variables from the new theme class for the main area
        // This ensures the direct children and the element itself get the root variables applied.
        areaToThemeElement.style.backgroundColor = 'var(--background-color)';
        areaToThemeElement.style.color = 'var(--text-color)';
        
        const currentThemeObject = themesArray.find(t => t.value === themeValue);

        // Call the optional callback if provided, passing the new theme value and object
        if (onThemeChangeCallback && typeof onThemeChangeCallback === 'function') {
            onThemeChangeCallback(themeValue, currentThemeObject);
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

    return applyTheme; // Optionally return the applyTheme function
}
