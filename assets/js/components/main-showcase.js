import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals } from './components/modal.js'; // If index.html has modals
import { initializeTabs } from './components/tabs.js';     // If index.html has tabs
// Import other generic components used on index.html
// NOTE: getSidebarHTML, getMobileNavHTML, getMainContentHTML were previously inline in index.html
// For a truly modular approach, these would also be functions, perhaps in a utility module
// or their content would be static in index.html and JS would only handle themes/interactions.
// For now, I'll assume they are made global or available to theme-switcher.js

// Make HTML generating functions available if theme-switcher.js needs them
// This is a bit of a hack for demo purposes. Ideally, theme-switcher would not re-render content.
window.getSidebarHTML = (logoText = "FitApp", userName = "Trainer") => { /* ... copy from index.html ... */
    return `
    <aside class="pt-sidebar">
        <div class="pt-sidebar__header"><h1 class="pt-sidebar__logo">${logoText}</h1></div>
        <nav class="pt-sidebar__nav"><ul class="pt-sidebar__nav-list">
            <li class="pt-sidebar__nav-item"><a href="#dashboard" class="pt-sidebar__nav-link is-active"><span class="pt-sidebar__nav-icon">D</span><span class="pt-sidebar__nav-text">Dashboard</span></a></li>
            <li class="pt-sidebar__nav-item"><a href="#clients" class="pt-sidebar__nav-link"><span class="pt-sidebar__nav-icon">C</span><span class="pt-sidebar__nav-text">Clients</span></a></li>
            <li class="pt-sidebar__nav-item"><a href="#workouts" class="pt-sidebar__nav-link"><span class="pt-sidebar__nav-icon">W</span><span class="pt-sidebar__nav-text">Workouts</span></a></li>
            <li class="pt-sidebar__nav-item"><a href="#schedule" class="pt-sidebar__nav-link"><span class="pt-sidebar__nav-icon">S</span><span class="pt-sidebar__nav-text">Schedule</span></a></li>
            <li class="pt-sidebar__nav-item"><a href="#settings" class="pt-sidebar__nav-link"><span class="pt-sidebar__nav-icon">⚙</span><span class="pt-sidebar__nav-text">Settings</span></a></li>
        </ul></nav>
        <div class="pt-sidebar__footer"><a href="#profile" class="pt-sidebar__user-profile"><span class="pt-sidebar__user-avatar">${userName.charAt(0)}</span><span class="pt-sidebar__user-name">${userName}</span></a><a href="#logout" class="pt-sidebar__logout-link"><span class="pt-sidebar__nav-icon">→</span><span class="pt-sidebar__nav-text">Logout</span></a></div>
    </aside>`;
};


const themesForIndex = [ // Duplicated here for now, or import from a shared config
    { value: 'theme-modern-professional', name: 'Modern & Professional', sidebarLogo: 'ProTrain', sidebarUser: 'Alex P.' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive', sidebarLogo: 'WellFit', sidebarUser: 'Sam K.' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating', sidebarLogo: 'IgniteFit', sidebarUser: 'Max Power' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded', sidebarLogo: 'TerraFit', sidebarUser: 'Willow G.' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist', sidebarLogo: 'ELEVATE', sidebarUser: 'Kendall R.' },
    { value: 'theme-retro-funk', name: 'Retro Funk', sidebarLogo: 'GrooveFit', sidebarUser: 'DJ Flex' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel', svgFill: '#E53935', sidebarLogo: 'GRIT', sidebarUser: 'R. Boulder' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven', svgFill: '#00D1FF', sidebarLogo: 'D4TA', sidebarUser: 'Dr. Byte' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop', svgFill: '#FF6B6B', sidebarLogo: 'POPfit', sidebarUser: 'Zippy' }
];

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherElement = document.getElementById('theme-switcher');
    const themedAreaElement = document.getElementById('themed-area');
    const mainComponentsContainer = document.getElementById('main-components-container');
    const mobileNavGlobalContainer = document.getElementById('mobile-nav-global-container');

    if (!themedAreaElement || !themeSwitcherElement) {
        console.error("index.html: Essential page elements for theme switching not found.");
        return;
    }
    
    // Inject initial main content and mobile nav if they aren't static in index.html
    // Assuming getMainContentHTML and getMobileNavHTML are global or imported
    if (mainComponentsContainer && typeof getMainContentHTML === 'function') {
        mainComponentsContainer.innerHTML = getMainContentHTML(themesForIndex[0].value);
    }
    if (mobileNavGlobalContainer && typeof getMobileNavHTML === 'function') {
        mobileNavGlobalContainer.innerHTML = getMobileNavHTML();
    }


    const applyThemeFunction = initializeThemeSwitcher(themesForIndex, themeSwitcherElement, themedAreaElement, (newThemeValue) => {
        // This callback is called after theme-switcher.js applies the theme.
        // We might need to re-initialize active link switchers if sidebar/mobile nav HTML is re-rendered by theme-switcher.js
        setupActiveLinkSwitcher();
    });

    // Initialize other components on index.html
    // initializeModals();
    // initializeTabs();

    function setupActiveLinkSwitcher() {
        const allNavLinks = document.querySelectorAll('.pt-sidebar__nav-link, .pt-mobile-nav-banner__link');
        allNavLinks.forEach(link => {
            const newLink = link.cloneNode(true); 
            link.parentNode.replaceChild(newLink, link); 
            newLink.addEventListener('click', function(e) { /* ... same logic ... */
                e.preventDefault(); let parentNavList;
                if (this.classList.contains('pt-sidebar__nav-link')) parentNavList = this.closest('.pt-sidebar__nav-list');
                else if (this.classList.contains('pt-mobile-nav-banner__link')) parentNavList = this.closest('.pt-mobile-nav-banner__scroll-container');
                if (parentNavList) { parentNavList.querySelectorAll('.is-active').forEach(el => el.classList.remove('is-active')); this.classList.add('is-active');}
            });
        });
    }
    setupActiveLinkSwitcher(); // Initial call
});
