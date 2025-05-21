// assets/js/components/accordion.js

/**
 * Initializes all accordion components on the page.
 * Expects .pt-accordion__button elements with aria-controls="contentId".
 * And corresponding content elements with that ID and a `hidden` attribute.
 */
export function initializeAccordions() {
    const accordionButtons = document.querySelectorAll('.pt-accordion__button');
    // console.log(`Initializing ${accordionButtons.length} accordion buttons.`);

    accordionButtons.forEach(button => {
        // Check if this button has already been initialized to prevent duplicate listeners
        // This is useful if initializeAccordions() might be called multiple times (e.g., after dynamic content loads)
        if (button.dataset.accordionInitialized === 'true' && !button.closest('#exerciseListContainer')) { // Allow re-init for exercise list specifically if needed
            return;
        }
        button.dataset.accordionInitialized = 'true'; // Mark as initialized

        button.addEventListener('click', () => {
            const contentId = button.getAttribute('aria-controls');
            const content = document.getElementById(contentId);
            const accordionItem = button.closest('.pt-accordion__item'); 

            if (!content) {
                console.warn(`Accordion content with ID "${contentId}" not found.`);
                return;
            }
            if (!accordionItem) {
                 console.warn(`Accordion item wrapper not found for button controlling "${contentId}".`);
                return;
            }

            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            
            // Standard behavior: toggle current accordion
            button.setAttribute('aria-expanded', String(!isExpanded));
            content.hidden = isExpanded; 
            
            if (!isExpanded) {
                accordionItem.classList.add('is-open'); 
            } else {
                accordionItem.classList.remove('is-open');
            }
        });

        // Set initial state based on aria-expanded
        const initialIsExpanded = button.getAttribute('aria-expanded') === 'true';
        const contentId = button.getAttribute('aria-controls');
        const content = document.getElementById(contentId);
        if (content) {
            content.hidden = !initialIsExpanded;
            if (initialIsExpanded && button.closest('.pt-accordion__item')) {
                 button.closest('.pt-accordion__item').classList.add('is-open');
            }
        }
    });
}
