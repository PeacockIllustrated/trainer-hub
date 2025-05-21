// assets/js/theme-switcher.js

const THEME_STORAGE_KEY_PREFIX = 'fitflow_user_theme_preference_'; // Prefix for storage key

/**
 * Initializes the theme switcher dropdown and handles theme changes,
 * remembering the user's last selection via Local Storage.
 * @param {Array} themesArray - Array of theme objects {value, name, ...any other theme-specific data}.
 * @param {HTMLElement} themeSwitcherSelectElement - The <select> element for theme switching.
 * @param {HTMLElement} areaToThemeElement - The main DOM element to apply the theme class to.
 * @param {Function} [onThemeChangeCallback] - Optional callback function after a theme is applied. 
 *                                             Receives (newThemeValue: string, currentThemeObject: object).
 * @param {string} [pageKey='default'] - A unique key for this page/context to store its theme preference separately.
 */
export function initializeThemeSwitcher(
    themesArray, 
    themeSwitcherSelectElement, 
    areaToThemeElement, 
    onThemeChangeCallback,
    pageKey = 'default' // Unique key for storing this page's theme
) {
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

    const currentThemeStorageKey = THEME_STORAGE_KEY_PREFIX + pageKey;

    // Populate the select dropdown
    themesArray.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.name;
        themeSwitcherSelectElement.appendChild(option);
    });

    // Function to apply the theme
    function applyTheme(themeValue) {
        themesArray.forEach(t => {
            if (areaToThemeElement.classList.contains(t.value)) {
                areaToThemeElement.classList.remove(t.value);
            }
        });
        areaToThemeElement.classList.add(themeValue);
        areaToThemeElement.style.backgroundColor = 'var(--background-color)';
        areaToThemeElement.style.color = 'var(--text-color)';
        
        // Save the selected theme to Local Storage for this pageKey
        try {
            localStorage.setItem(currentThemeStorageKey, themeValue);
        } catch (e) {
            console.warn("Could not save theme preference to Local Storage:", e);
        }
        
        const currentThemeObject = themesArray.find(t => t.value === themeValue);
        if (onThemeChangeCallback && typeof onThemeChangeCallback === 'function') {
            onThemeChangeCallback(themeValue, currentThemeObject || {});
        }
    }

    // Determine the initial theme
    let initialThemeValue = themesArray[0].value; // Default to the first theme
    try {
        const storedTheme = localStorage.getItem(currentThemeStorageKey);
        if (storedTheme && themesArray.some(t => t.value === storedTheme)) {
            initialThemeValue = storedTheme;
            // console.log(`Theme switcher (${pageKey}): Loaded '${storedTheme}' from Local Storage.`);
        } else {
            // console.log(`Theme switcher (${pageKey}): No valid stored theme found, defaulting to '${initialThemeValue}'.`);
        }
    } catch (e) {
        console.warn("Could not load theme preference from Local Storage:", e);
    }

    // Apply the initial theme
    themeSwitcherSelectElement.value = initialThemeValue;
    applyTheme(initialThemeValue);


    // Add event listener to the select dropdown
    themeSwitcherSelectElement.addEventListener('change', (event) => {
        applyTheme(event.target.value);
    });

    // console.log(`Theme switcher initialized for pageKey: '${pageKey}' on element:`, areaToThemeElement);
    return applyTheme;
}
