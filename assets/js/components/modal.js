/**
 * Initializes all modals on the page with the class 'pt-modal'.
 * Expects a trigger button with `data-modal-target="#modalId"` OR
 * specific open buttons to be handled by other scripts calling `openModal(modalId)`.
 * Modals should have an ID.
 * Close buttons within the modal should have the class `pt-modal__close`.
 */
export function initializeModals() {
    const allModals = document.querySelectorAll('.pt-modal');

    allModals.forEach(modal => {
        const modalId = modal.id;
        if (!modalId) {
            console.warn("Modal found without an ID. It can still be initialized but direct targeting via data-modal-target might not work.", modal);
            // Continue initialization for close buttons even if no ID for trigger
        }

        // Generic trigger buttons using data-modal-target
        // Ensure these triggers are unique if multiple buttons target the same modal on a page.
        // Or handle specific button clicks in page-specific init.js files.
        if (modalId) {
            const triggerButtons = document.querySelectorAll(`[data-modal-target="#${modalId}"]`);
            triggerButtons.forEach(triggerButton => {
                triggerButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal(modalId);
                });
            });
        }

        const closeButtons = modal.querySelectorAll('.pt-modal__close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(modal.id || ''); // Pass modal.id if available
            });
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) { // Click on backdrop
                closeModal(modal.id || '');
            }
        });
    });
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('is-active');
        // Optional: Trap focus within the modal for accessibility
    } else {
        console.warn(`Modal with ID "${modalId}" not found.`);
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('is-active');
        // Optional: Return focus to the element that opened the modal
    } else {
        // If modalId is empty, it might be a modal without an ID that was closed by its own button.
        if (modalId) console.warn(`Modal with ID "${modalId}" not found.`);
    }
}