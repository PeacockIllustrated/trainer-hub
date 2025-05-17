// personal-trainer-components/assets/js/main.js
console.log("Main JavaScript file loaded.");

// Future: Add global JavaScript functionalities here.
// For example, a theme switcher might be implemented here if not handled by backend.

// Example of component-specific JS (if not in separate files yet):
// document.addEventListener('DOMContentLoaded', () => {
//     const allModals = document.querySelectorAll('.pt-modal');
//     allModals.forEach(modal => {
//         const trigger = document.querySelector(`[data-modal-target="${modal.id}"]`);
//         const closeButtons = modal.querySelectorAll('.modal-close');

//         if(trigger) {
//             trigger.addEventListener('click', () => modal.classList.add('is-active'));
//         }
//         closeButtons.forEach(btn => {
//             btn.addEventListener('click', () => modal.classList.remove('is-active'));
//         });
//         // Optional: Close on clicking background
//         modal.addEventListener('click', (event) => {
//             if (event.target === modal) {
//                 modal.classList.remove('is-active');
//             }
//         });
//     });
// });