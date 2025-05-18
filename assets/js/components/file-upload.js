/**
 * Initializes file upload components to display the chosen file name.
 * Expects an input[type="file"] and a sibling/nearby element with class .pt-file-upload__name.
 */
export function initializeFileUploads() {
    const fileUploadInputs = document.querySelectorAll('.pt-file-upload input[type="file"]');
    fileUploadInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileUploadContainer = this.closest('.pt-file-upload');
            if (!fileUploadContainer) return;

            const fileNameDisplay = fileUploadContainer.querySelector('.pt-file-upload__name');
            if (!fileNameDisplay) return;

            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = 'No file chosen';
            }
        });
    });
}