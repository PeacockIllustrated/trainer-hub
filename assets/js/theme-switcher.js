// assets/js/theme-switcher.js

/**
 * Initializes the theme switcher dropdown and handles theme changes.
 * @param {Array} themesArray - Array of theme objects {value, name, ...}
 * @param {HTMLElement} themeSwitcherSelectElement - The select element for theme switching.
 * @param {HTMLElement} areaToThemeElement - The main area to apply the theme class to.
 * @param {Function} [onThemeChangeCallback] - Optional callback after theme is applied.
 */
export function initializeThemeSwitcher(themesArray, themeSwitcherSelectElement, areaToThemeElement, onThemeChangeCallback) {
    if (!themesArray || !themeSwitcherSelectElement || !areaToThemeElement) {
        console.error("Theme switcher initialization failed: Missing required elements or themes array.");
        console.log("themesArray:", themesArray);
        console.log("themeSwitcherSelectElement:", themeSwitcherSelectElement);
        console.log("areaToThemeElement:", areaToThemeElement);
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
        // Use the passed parameter 'areaToThemeElement' NOT a new 'themedArea'
        if (!areaToThemeElement) {
            console.error("applyTheme error: areaToThemeElement is undefined or null.");
            return;
        }

        areaToThemeElement.className = ''; // Clear all classes from the target area
        areaToThemeElement.classList.add(themeValue); // Add the new theme class

        // Force re-evaluation of CSS variables from the new theme class
        areaToThemeElement.style.backgroundColor = 'var(--background-color)';
        areaToThemeElement.style.color = 'var(--text-color)';

        // --- Specific logic for index.html's sidebar and mobile nav ---
        // This part makes theme-switcher.js less generic.
        // Consider moving this to the onThemeChangeCallback if possible.
        const mobileNavGlobalContainer = document.getElementById('mobile-nav-global-container');
        if (mobileNavGlobalContainer && mobileNavGlobalContainer.firstChild) {
            mobileNavGlobalContainer.firstChild.className = 'pt-mobile-nav-banner'; // Reset
            mobileNavGlobalContainer.firstChild.classList.add(themeValue); // Apply theme
        }

        const sidebarContainer = document.getElementById('sidebar-container');
        // Find the current theme object to get sidebarLogo and sidebarUser
        const currentThemeObj = themesArray.find(t => t.value === themeValue); 
        if (currentThemeObj && sidebarContainer && typeof window.getSidebarHTML === 'function') {
            sidebarContainer.innerHTML = window.getSidebarHTML(currentThemeObj.sidebarLogo, currentThemeObj.sidebarUser);
        }
        // --- End of index.html specific logic ---


        // Call the optional callback if provided
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

    return applyTheme; // Optionally return the applyTheme function
}
