/**
 * Initializes all multi-step forms (steppers) on the page.
 * Expects a <form> element containing:
 *  - A .pt-stepper div with .pt-stepper__step elements (each with data-step attribute)
 *  - .pt-form-step divs (each with data-step-content attribute matching stepper)
 *  - Navigation buttons with specific IDs or classes (e.g., #prevStepBtn, #nextStepBtn, #submitOnboardingBtn)
 *  - A review output div (e.g., #onboardingReviewOutput) for the final step.
 */
export function initializeStepper() {
    const formsWithSteppers = document.querySelectorAll('form[id*="OnboardingForm"], form[data-stepper="true"]'); 
    
    formsWithSteppers.forEach(form => {
        const stepperElement = form.querySelector('.pt-stepper');
        const formSteps = Array.from(form.querySelectorAll('.pt-form-step')); // Convert NodeList to Array
        const prevBtn = form.querySelector('[id*="prevStepBtn"], .stepper-prev-btn'); 
        const nextBtn = form.querySelector('[id*="nextStepBtn"], .stepper-next-btn');
        const submitBtn = form.querySelector('[id*="submitOnboardingBtn"], .stepper-submit-btn');
        const reviewOutput = form.querySelector('[id*="ReviewOutput"], .stepper-review-output');

        if (!stepperElement || !formSteps.length || !nextBtn) {
            console.warn("Required stepper elements not found within a form:", form);
            return;
        }

        let currentStepIndex = 0; // 0-indexed
        const totalSteps = formSteps.length;
        const formDataStore = {};

        function validateCurrentStep() {
            const currentStepContent = formSteps[currentStepIndex];
            if (!currentStepContent) return true;

            const inputs = currentStepContent.querySelectorAll('input[required], select[required], textarea[required]');
            for (let input of inputs) {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    return false;
                }
            }
            return true;
        }

        function collectStepData(stepIndexToCollect) {
            const stepContent = formSteps[stepIndexToCollect];
            if (!stepContent) return;

            const inputs = stepContent.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
            inputs.forEach(input => {
                if (input.id || input.name) formDataStore[input.id || input.name] = input.value;
            });
            const checkboxes = stepContent.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (cb.name) {
                    if (!formDataStore[cb.name]) formDataStore[cb.name] = [];
                    if (cb.checked) {
                         if (!formDataStore[cb.name].includes(cb.value || 'checked')) { // Avoid duplicates
                            formDataStore[cb.name].push(cb.value || 'checked');
                         }
                    } else { // Remove if unchecked
                        formDataStore[cb.name] = formDataStore[cb.name].filter(val => val !== (cb.value || 'checked'));
                    }
                }
            });
            const radios = stepContent.querySelectorAll('input[type="radio"]:checked');
            radios.forEach(rb => { if (rb.name) formDataStore[rb.name] = rb.value; });
        }

        function updateStepView() {
            // Update stepper indicators
            stepperElement.querySelectorAll('.pt-stepper__step').forEach((stepEl, index) => {
                stepEl.classList.remove('is-active', 'is-complete');
                if (index < currentStepIndex) stepEl.classList.add('is-complete');
                if (index === currentStepIndex) stepEl.classList.add('is-active');
            });

            // Show current form step
            formSteps.forEach((stepEl, index) => {
                stepEl.classList.remove('is-active');
                if (index === currentStepIndex) stepEl.classList.add('is-active');
            });

            // Update button states
            if(prevBtn) prevBtn.disabled = currentStepIndex === 0;
            if(nextBtn) nextBtn.style.display = currentStepIndex === totalSteps - 1 ? 'none' : 'inline-block';
            if(submitBtn) submitBtn.style.display = currentStepIndex === totalSteps - 1 ? 'inline-block' : 'none';

            // Populate review step
            if (currentStepIndex === totalSteps - 1 && reviewOutput) {
                // Ensure all data is collected up to the review step
                for (let i = 0; i < totalSteps -1; i++) { // Collect from all previous steps
                    if (!formSteps[i].classList.contains('review-data-collected')) { // Simple flag to avoid re-collection
                         collectStepData(i);
                         formSteps[i].classList.add('review-data-collected');
                    }
                }

                let reviewHTML = '<h4>Review Your Details:</h4><ul>';
                for (const key in formDataStore) {
                    let value = formDataStore[key];
                    let displayKey = key.replace(/^(onboard|adminClient)/, '').replace(/([A-Z])/g, ' $1').replace(/^ /,'').trim();
                    displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1); // Capitalize

                    if (Array.isArray(value)) value = value.join(', ');
                    if (value || value === false) { // Display even if false (for checkboxes that were unchecked)
                         reviewHTML += `<li><strong>${displayKey}:</strong> ${value || 'Not provided'}</li>`;
                    }
                }
                reviewHTML += '</ul>';
                reviewOutput.innerHTML = reviewHTML;
            }
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    collectStepData(currentStepIndex); // Collect data for current step before advancing
                    if (currentStepIndex < totalSteps - 1) currentStepIndex++;
                    updateStepView();
                }
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStepIndex > 0) currentStepIndex--;
                updateStepView();
            });
        }
        
        form.addEventListener('submit', (e) => {
            if (submitBtn && (e.submitter === submitBtn || !e.submitter) ) { // Check if the submit button was indeed clicked or if it's a programmatic submit
                e.preventDefault();
                if (validateCurrentStep()) { 
                    collectStepData(currentStepIndex); // Collect final step data
                    console.log('Final Onboarding Data:', JSON.parse(JSON.stringify(formDataStore))); // Deep copy for logging
                    alert('Onboarding Submitted (Demo)! Check console for data.');
                    form.reset(); 
                    // Reset formDataStore and stepper
                    for (const key in formDataStore) delete formDataStore[key];
                    formSteps.forEach(step => step.classList.remove('review-data-collected'));
                    currentStepIndex = 0;
                    updateStepView();
                }
            }
        });
        
        updateStepView(); // Initial view
    });
}