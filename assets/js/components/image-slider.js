/**
 * Initializes all image sliders with class .pt-image-slider.
 */
export function initializeImageSliders() {
    document.querySelectorAll('.pt-image-slider').forEach(slider => {
        const film = slider.querySelector('.pt-image-slider__film');
        const slides = film ? film.querySelectorAll('.pt-image-slider__slide') : [];
        const prevBtn = slider.querySelector('.pt-image-slider__nav--prev');
        const nextBtn = slider.querySelector('.pt-image-slider__nav--next');
        const dotsContainer = slider.querySelector('.pt-image-slider__dots');
        
        if (!film || !slides || slides.length === 0) {
            // console.warn("Image slider found without film or slides.", slider);
            if(prevBtn) prevBtn.style.display = 'none';
            if(nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentIndex = 0;
        const totalSlides = slides.length;
        let dots = [];

        function updateSlider() {
            film.style.transform = `translateX(-${currentIndex * 100}%)`;
            if (dots.length) {
                dots.forEach(dot => dot.classList.remove('is-active'));
                if (dots[currentIndex]) dots[currentIndex].classList.add('is-active');
            }
            if(prevBtn) prevBtn.disabled = totalSlides <= 1; // Disable if only one slide
            if(nextBtn) nextBtn.disabled = totalSlides <= 1;
        }

        function goToSlide(index) {
            if (index >= 0 && index < totalSlides) {
                currentIndex = index;
                updateSlider();
            }
        }

        // Create dots
        if (dotsContainer && totalSlides > 1) {
            dotsContainer.innerHTML = ''; // Clear any existing dots
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.classList.add('pt-image-slider__dot');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
            dots = Array.from(dotsContainer.querySelectorAll('.pt-image-slider__dot'));
        } else if (dotsContainer) {
            dotsContainer.innerHTML = ''; // Clear if no slides or one slide
        }


        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalSlides - 1;
                updateSlider();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex < totalSlides - 1) ? currentIndex + 1 : 0;
                updateSlider();
            });
        }
        
        updateSlider(); // Initial setup
    });
}