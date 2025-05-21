// assets/js/theme-switcher.js

/**
 * Initializes the theme switcher dropdown and handles theme changes.
 * @param {Array} themesArray - Array of theme objects {value, name, ...any other theme-specific data}.
 * @param {HTMLElement} themeSwitcherSelectElement - The <select> element for theme switching.
 * @param {HTMLElement} areaToThemeElement - The main DOM element to apply the theme class to.
 * @param {Function} [onThemeChangeCallback] - Optional callback function after a theme is applied. 
 *                                             Receives (newThemeValue: string, currentThemeObject: object).
 */
export function initializeThemeSwitcher(themesArray, themeSwitcherSelectElement, areaToThemeElement, onThemeChangeCallback) {
    if (!themesArray || themesArray.length === 0) {
        console.warn("Theme switcher: No themes provided.");
        if(themeSwitcherSelectElement) themeSwitcherSelectElement.style.display = 'none';
        return;
    }
    if (!themeSwitcherSelectElement) {
        console.error("Theme switcher: Select element not provided.");
        return;
    }
    if (!areaToThemeElement) {
        console.error("Theme switcher: Area to theme element not provided.");
        return;
    }

    // Populate the select dropdown
    themesArray.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.name;
        themeSwitcherSelectElement.appendChild(option);
    });

    // Function to apply the theme
    function applyTheme(themeValue) {
        // Clear previous theme classes from the main area
        themesArray.forEach(t => {
            if (areaToThemeElement.classList.contains(t.value)) {
                areaToThemeElement.classList.remove(t.value);
            }
        });
        // Add the new theme class
        areaToThemeElement.classList.add(themeValue);

        // Apply root CSS variables for background and text color to the themed area
        // This ensures the main container itself reflects the theme immediately.
        areaToThemeElement.style.backgroundColor = 'var(--background-color)';
        areaToThemeElement.style.color = 'var(--text-color)';
        
        const currentThemeObject = themesArray.find(t => t.value === themeValue);

        // Call the optional callback for page-specific theme updates
        if (onThemeChangeCallback && typeof onThemeChangeCallback === 'function') {
            onThemeChangeCallback(themeValue, currentThemeObject || {}); // Pass empty obj if not found
        }
    }

    // Apply the first theme by default
    if (themesArray.length > 0) {
        themeSwitcherSelectElement.value = themesArray[0].value;
        applyTheme(themesArray[0].value);
    }

    // Add event listener to the select dropdown
    themeSwitcherSelectElement.addEventListener('change', (event) => {
        applyTheme(event.target.value);
    });

    // console.log("Theme switcher initialized for:", areaToThemeElement);
    return applyTheme; // Optionally return the applyTheme function for direct use
}
