/**
 * Initializes all accordion components on the page.
 * Expects .pt-accordion__button elements with aria-controls="contentId".
 * And corresponding content elements with that ID and a `hidden` attribute.
 */
export function initializeAccordions() {
    document.querySelectorAll('.pt-accordion__button').forEach(button => {
        button.addEventListener('click', () => {
            const contentId = button.getAttribute('aria-controls');
            const content = document.getElementById(contentId);
            if (!content) {
                console.warn(`Accordion content with ID "${contentId}" not found.`);
                return;
            }

            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', !isExpanded);
            content.hidden = isExpanded; // Toggle hidden attribute
        });

        // Set initial state based on aria-expanded (if button starts expanded, show content)
        if (button.getAttribute('aria-expanded') === 'true') {
             const contentId = button.getAttribute('aria-controls');
             const content = document.getElementById(contentId);
             if (content) content.hidden = false;
        } else {
             const contentId = button.getAttribute('aria-controls');
             const content = document.getElementById(contentId);
             if (content) content.hidden = true;
        }
    });
}