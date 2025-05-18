/**
 * Initializes all tab components on the page.
 * Expects a container with class .pt-tabs.
 * Inside, a .pt-tabs__list with [role="tab"] buttons, each with aria-controls="panelId".
 * And .pt-tabs__panel elements with [role="tabpanel"] and matching IDs.
 */
export function initializeTabs() {
    document.querySelectorAll('.pt-tabs').forEach(tabContainer => {
        const tabButtons = tabContainer.querySelectorAll('.pt-tabs__list [role="tab"]');
        const tabPanels = tabContainer.querySelectorAll('.pt-tabs__panel[role="tabpanel"]');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Deactivate all tabs and panels within this specific tab container
                tabButtons.forEach(btn => {
                    btn.setAttribute('aria-selected', 'false');
                    btn.classList.remove('is-active');
                });
                tabPanels.forEach(panel => {
                    panel.hidden = true;
                    panel.classList.remove('is-active');
                });

                // Activate clicked tab and corresponding panel
                button.setAttribute('aria-selected', 'true');
                button.classList.add('is-active');
                
                const panelId = button.getAttribute('aria-controls');
                const activePanel = tabContainer.querySelector(`#${panelId}`);
                if (activePanel) {
                    activePanel.hidden = false;
                    activePanel.classList.add('is-active');
                }
            });
        });

        // Ensure only the initially active tab's panel is shown
        // (if an 'is-active' class is set in HTML for the button)
        let M_initialActiveTab = false;
        tabButtons.forEach(button => {
            if (button.classList.contains('is-active') && button.getAttribute('aria-selected') === 'true') {
                const panelId = button.getAttribute('aria-controls');
                const activePanel = tabContainer.querySelector(`#${panelId}`);
                if (activePanel) {
                    activePanel.hidden = false;
                    activePanel.classList.add('is-active');
                    M_initialActiveTab = true;
                }
            }
        });
        // If no tab is marked active in HTML, activate the first one
        if (!M_initialActiveTab && tabButtons.length > 0) {
            tabButtons[0].click();
        }

    });
}