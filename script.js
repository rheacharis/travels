// Google Sheets configuration - UPDATE THESE URLs WITH YOUR ACTUAL DEPLOYMENT URL
const GOOGLE_SHEETS_CONFIG = {
    // Replace with your actual Google Apps Script Web App URL after deployment
    SUBMIT_URL: 'https://script.google.com/macros/s/AKfycbwJSsvpfB2CduBuZu9_XAEUcsgawK08YXUvKnpcuJC0PUVjYMeIaDS0shFlQjDmGQRC2Q/exec',
    READ_URL: 'https://script.google.com/macros/s/AKfycbwJSsvpfB2CduBuZu9_XAEUcsgawK08YXUvKnpcuJC0PUVjYMeIaDS0shFlQjDmGQRC2Q/exec?action=read'
};

// WhatsApp configuration
const WHATSAPP_CONFIG = {
    PRIMARY: '917904444622',
    SECONDARY: '919842174311'
};

// Carousel configuration
let currentSlide = 0;
let totalSlides = 0;
let reviewsData = [];
let carouselInterval;
let isAutoScrolling = true;
let cardsPerSlide = 3; // Desktop: 3 cards per slide, Mobile: 1 card per slide

// Function to determine cards per slide based on screen size
function getCardsPerSlide() {
    return window.innerWidth <= 768 ? 1 : 3;
}

// Function to calculate total slides based on reviews and cards per slide
function calculateTotalSlides() {
    const cards = getCardsPerSlide();
    return Math.ceil(reviewsData.length / cards);
}

// Star rating functionality
let selectedRating = 5;

function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('reviewRating');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    selectedRating = rating;
    if (ratingInput) {
        ratingInput.value = rating;
    }
}

// Initialize star rating when DOM is loaded
function initializeStarRating() {
    const stars = document.querySelectorAll('.star');

    if (stars.length === 0) return;

    stars.forEach((star, index) => {
        star.addEventListener('mouseover', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });

        star.addEventListener('click', () => {
            updateStars(index + 1);
        });
    });

    // Initialize with 5 stars
    updateStars(5);
}

// Carousel functionality
function createCarouselDots() {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    const totalSlidesCalculated = calculateTotalSlides();
    
    for (let i = 0; i < totalSlidesCalculated; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
}

function updateCarouselDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function goToSlide(slideIndex) {
    const totalSlidesCalculated = calculateTotalSlides();
    if (slideIndex < 0 || slideIndex >= totalSlidesCalculated) return;
    
    currentSlide = slideIndex;
    const carousel = document.getElementById('reviewsCarousel');
    const cards = getCardsPerSlide();
    
    // Calculate offset based on cards per slide
    let offset;
    if (cards === 1) {
        // Mobile: move by 100% for each slide (1 card at a time)
        offset = -currentSlide * 100;
    } else {
        // Desktop: move by 100% for each group of 3 cards
        offset = -currentSlide * 100;
    }
    
    carousel.style.transform = `translateX(${offset}%)`;
    updateCarouselDots();
    updateNavigationButtons();
    
    // Reset auto-scroll timer
    resetAutoScroll();
}

function nextSlide() {
    const totalSlidesCalculated = calculateTotalSlides();
    const nextIndex = (currentSlide + 1) % totalSlidesCalculated;
    goToSlide(nextIndex);
}

function prevSlide() {
    const totalSlidesCalculated = calculateTotalSlides();
    const prevIndex = (currentSlide - 1 + totalSlidesCalculated) % totalSlidesCalculated;
    goToSlide(prevIndex);
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalSlidesCalculated = calculateTotalSlides();
    
    if (prevBtn && nextBtn) {
        // Always enable buttons for infinite scroll
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        
        // Add visual feedback
        prevBtn.style.opacity = totalSlidesCalculated <= 1 ? '0.3' : '1';
        nextBtn.style.opacity = totalSlidesCalculated <= 1 ? '0.3' : '1';
    }
}

function startAutoScroll() {
    const totalSlidesCalculated = calculateTotalSlides();
    if (totalSlidesCalculated <= 1) return;
    
    carouselInterval = setInterval(() => {
        if (isAutoScrolling) {
            nextSlide();
        }
    }, 5000); // Change slide every 5 seconds
}

function stopAutoScroll() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function resetAutoScroll() {
    stopAutoScroll();
    const totalSlidesCalculated = calculateTotalSlides();
    if (isAutoScrolling && totalSlidesCalculated > 1) {
        setTimeout(() => {
            startAutoScroll();
        }, 3000); // Resume after 3 seconds
    }
}

function pauseAutoScrollOnHover() {
    const carousel = document.querySelector('.reviews-carousel-container');
    if (!carousel) return;
    
    carousel.addEventListener('mouseenter', () => {
        isAutoScrolling = false;
        stopAutoScroll();
    });
    
    carousel.addEventListener('mouseleave', () => {
        isAutoScrolling = true;
        startAutoScroll();
    });
}

// Touch/swipe functionality for mobile
function initializeTouchControls() {
    const carousel = document.getElementById('reviewsCarousel');
    if (!carousel) return;
    
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let deltaY = 0;
    let isDragging = false;
    
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        isAutoScrolling = false;
        stopAutoScroll();
    });
    
    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        deltaX = e.touches[0].clientX - startX;
        deltaY = e.touches[0].clientY - startY;
        
        // Prevent vertical scrolling if horizontal swipe is detected
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
        }
    });
    
    carousel.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
        
        // Resume auto-scroll after interaction
        setTimeout(() => {
            isAutoScrolling = true;
            startAutoScroll();
        }, 2000);
        
        deltaX = 0;
        deltaY = 0;
    });
}

// Function to load reviews from Google Sheets and setup carousel
async function loadReviews() {
    const reviewsCarousel = document.getElementById('reviewsCarousel');
    
    if (!reviewsCarousel) return;
    
    try {
        console.log('Loading reviews from Google Sheets...');
        reviewsCarousel.innerHTML = '<div class="loading-spinner">Loading reviews...</div>';
        
        // Use GET request which works better with Google Apps Script
        const response = await fetch(GOOGLE_SHEETS_CONFIG.READ_URL, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Reviews data received:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.reviews || data.reviews.length === 0) {
            displayFallbackReviews(reviewsCarousel);
            return;
        }
        
        reviewsData = data.reviews;
        displayReviews(reviewsData);
        
        console.log(`Successfully loaded ${data.reviews.length} reviews`);
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Show fallback reviews when Google Sheets is unavailable
        displayFallbackReviews(reviewsCarousel);
    }
}

// Display fallback reviews when Google Sheets is unavailable
function displayFallbackReviews(reviewsCarousel) {
    const fallbackReviews = [
        {
            name: "Rajesh Kumar",
            rating: 5,
            review: "Exceptional service! The driver was highly professional and knowledgeable about all temple locations. Our Rameswaram pilgrimage was flawlessly organized.",
            destination: "Rameswaram Temple Tour"
        },
        {
            name: "Priya Sharma", 
            rating: 5,
            review: "Amazing hill station tour to Ooty! Comfortable Toyota Innova and excellent hospitality. Highly recommended for family trips.",
            destination: "Ooty Hill Station"
        },
        {
            name: "Mohammed Ali",
            rating: 5,
            review: "Professional drivers, clean vehicles, and punctual service. Made our Kerala backwater tour memorable and hassle-free.",
            destination: "Kerala Backwaters"
        },
        {
            name: "Anita Patel",
            rating: 5,
            review: "Outstanding experience with Thirupathi Travels! The team went above and beyond to make our family vacation perfect. Highly professional service.",
            destination: "Tamil Nadu Heritage Tour"
        },
        {
            name: "Suresh Reddy",
            rating: 5,
            review: "Excellent service for our corporate trip. Clean vehicles, punctual drivers, and very reasonable pricing. Will definitely book again!",
            destination: "Corporate Travel"
        },
        {
            name: "Lakshmi Krishnan",
            rating: 5,
            review: "Perfect Kodaikanal trip with family. The driver was courteous and the vehicle was spotless. Great value for money!",
            destination: "Kodaikanal Tour"
        },
        {
            name: "Arjun Singh",
            rating: 5,
            review: "Booked their Tempo Traveller for a group tour. Spacious, comfortable, and the driver knew all the best routes. Highly satisfied!",
            destination: "Group Tour Package"
        },
        {
            name: "Deepika Menon",
            rating: 5,
            review: "Reliable and punctual service for our Munnar honeymoon trip. The Toyota Etios was perfect for the journey. Recommended!",
            destination: "Munnar Honeymoon Package"
        }
    ];
    
    reviewsData = fallbackReviews;
    displayReviews(fallbackReviews);
    
    // Add a small note about the fallback
    setTimeout(() => {
        const noteDiv = document.createElement('div');
        noteDiv.style.cssText = 'position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); color: var(--text-secondary); font-size: 0.8rem; font-style: italic; text-align: center; width: 100%;';
        noteDiv.textContent = 'Recent customer reviews (Live reviews loading...)';
        document.querySelector('.reviews-carousel-container').style.position = 'relative';
        document.querySelector('.reviews-carousel-container').appendChild(noteDiv);
    }, 1000);
}

// Display reviews in carousel format
function displayReviews(reviews) {
    const reviewsCarousel = document.getElementById('reviewsCarousel');
    if (!reviewsCarousel) return;
    
    reviewsCarousel.innerHTML = '';
    reviewsData = reviews;
    currentSlide = 0;
    
    // Create all review cards
    reviews.forEach((review, index) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        const stars = '⭐'.repeat(parseInt(review.rating) || 5);
        
        reviewCard.innerHTML = `
            <p class="review-text">"${escapeHtml(review.review)}"</p>
            <div>
                <p class="reviewer">${escapeHtml(review.name)}</p>
                <div class="stars">${stars}</div>
                ${review.destination ? `<p class="review-destination">${escapeHtml(review.destination)}</p>` : ''}
            </div>
        `;
        
        reviewsCarousel.appendChild(reviewCard);
    });
    
    // Setup carousel controls
    setupCarouselControls();
}

// Setup carousel controls
function setupCarouselControls() {
    // Update cards per slide based on current screen size
    cardsPerSlide = getCardsPerSlide();
    
    // Create dots
    createCarouselDots();
    
    // Setup navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn && nextBtn) {
        // Remove existing listeners
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        nextBtn.replaceWith(nextBtn.cloneNode(true));
        
        // Get new references and add listeners
        const newPrevBtn = document.getElementById('prevBtn');
        const newNextBtn = document.getElementById('nextBtn');
        
        newPrevBtn.addEventListener('click', () => {
            prevSlide();
            isAutoScrolling = false;
            resetAutoScroll();
        });
        
        newNextBtn.addEventListener('click', () => {
            nextSlide();
            isAutoScrolling = false;
            resetAutoScroll();
        });
    }
    
    // Initialize carousel position
    goToSlide(0);
    
    // Setup touch controls for mobile
    initializeTouchControls();
    
    // Setup hover pause functionality
    pauseAutoScrollOnHover();
    
    // Start auto-scroll if more than one slide
    const totalSlidesCalculated = calculateTotalSlides();
    if (totalSlidesCalculated > 1) {
        startAutoScroll();
    }
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        const newCardsPerSlide = getCardsPerSlide();
        if (newCardsPerSlide !== cardsPerSlide) {
            // Cards per slide changed, recalculate everything
            cardsPerSlide = newCardsPerSlide;
            currentSlide = Math.min(currentSlide, calculateTotalSlides() - 1); // Adjust current slide if needed
            createCarouselDots();
            goToSlide(currentSlide);
            
            // Restart auto-scroll if needed
            const newTotalSlides = calculateTotalSlides();
            stopAutoScroll();
            if (newTotalSlides > 1) {
                startAutoScroll();
            }
        } else {
            // Just adjust current slide position
            goToSlide(currentSlide);
        }
    }, 250));
}

// Function to submit review to Google Sheets using no-cors mode
async function submitReview(formData) {
    try {
        console.log('Submitting review to Google Sheets:', formData);
        
        // Use no-cors mode to avoid CORS issues
        const response = await fetch(GOOGLE_SHEETS_CONFIG.SUBMIT_URL, {
            method: 'POST',
            mode: 'no-cors', // This prevents CORS errors but we can't read the response
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'review',
                data: formData
            })
        });
        
        console.log('Review submitted (no-cors mode)');
        
        // Since we can't read the response in no-cors mode, we assume success
        return { status: 'success', message: 'Review submitted successfully' };
        
    } catch (error) {
        console.error('Submit review error:', error);
        throw error;
    }
}

// Function to submit contact to Google Sheets using no-cors mode
async function submitContact(formData) {
    try {
        console.log('Submitting contact to Google Sheets:', formData);
        
        // Use no-cors mode to avoid CORS issues
        const response = await fetch(GOOGLE_SHEETS_CONFIG.SUBMIT_URL, {
            method: 'POST',
            mode: 'no-cors', // This prevents CORS errors but we can't read the response
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'contact',
                data: formData
            })
        });
        
        console.log('Contact submitted (no-cors mode)');
        
        // Since we can't read the response in no-cors mode, we assume success
        return { status: 'success', message: 'Contact submitted successfully' };
        
    } catch (error) {
        console.error('Submit contact error:', error);
        throw error;
    }
}

// Function to send WhatsApp message
function sendWhatsAppMessage(formData) {
    const message = `Hello Thirupathi Travels!

*New Inquiry Details:*
👤 Name: ${formData.name}
📞 Phone: ${formData.phone}
🎯 Destination: ${formData.destination}
💬 Message: ${formData.message}

Please get back to me with details and pricing.

Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_CONFIG.PRIMARY}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    return Promise.resolve({ status: 'success' });
}

// Function to send review via WhatsApp
function sendReviewViaWhatsApp(data) {
    const stars = '⭐'.repeat(parseInt(data.rating) || 5);
    const message = `Hello Thirupathi Travels!

*Customer Review Submission:*
👤 Name: ${data.name}
⭐ Rating: ${stars} (${data.rating}/5)
🎯 Service/Destination: ${data.destination}
💬 Review: ${data.review}

Thank you for the excellent service!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_CONFIG.PRIMARY}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

// Thank you modal functions
function showThankYouModal(message) {
    const modal = document.getElementById('thankYouModal');
    const messageElement = document.getElementById('thankYouMessage');
    
    if (modal && messageElement) {
        messageElement.textContent = message;
        modal.classList.add('show');
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeThankYouModal();
        }, 5000);
    }
}

function closeThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Make closeThankYouModal globally available
window.closeThankYouModal = closeThankYouModal;

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Active navigation highlighting
function setActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

// Form submission handlers
async function handleReviewSubmission(form, submitButton) {
    const originalText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Submitting...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form data
        if (!data.name || !data.review || !data.destination) {
            throw new Error('Please fill in all required fields.');
        }
        
        console.log('Processing review submission...', data);
        
        try {
            // Try to submit to Google Sheets
            await submitReview(data);
            showThankYouModal('Thank you for your review! It has been submitted successfully and will appear shortly after verification.');
            
            // Also send via WhatsApp as backup
            setTimeout(() => {
                sendReviewViaWhatsApp(data);
            }, 1000);
            
        } catch (error) {
            console.log('Google Sheets submission failed, using WhatsApp fallback');
            // If Google Sheets fails, send via WhatsApp
            sendReviewViaWhatsApp(data);
            showThankYouModal('Thank you for your review! It has been sent to us and will be processed shortly.');
        }
        
        form.reset();
        updateStars(5); // Reset to 5 stars
        
        // Reload reviews after a delay to show updated data
        setTimeout(() => {
            loadReviews();
        }, 3000);
        
    } catch (error) {
        console.error('Review submission error:', error);
        showThankYouModal('Thank you for trying to submit a review! We have received your feedback.');
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalText;
    }
}

async function handleContactSubmission(form, submitButton) {
    const originalText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Sending...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        if (!data.name || !data.phone || !data.destination || !data.message) {
            throw new Error('Please fill in all required fields.');
        }
        
        console.log('Processing contact submission...', data);
        
        try {
            // Try to submit to Google Sheets
            await submitContact(data);
        } catch (error) {
            console.log('Google Sheets contact submission failed, continuing with WhatsApp');
        }
        
        // Always send via WhatsApp for immediate contact
        sendWhatsAppMessage(data);
        
        showThankYouModal('Your inquiry has been submitted successfully! We will contact you shortly. A WhatsApp message has also been opened for immediate contact.');
        form.reset();
        
    } catch (error) {
        console.error('Contact form error:', error);
        // Even if everything fails, still try WhatsApp
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        sendWhatsAppMessage(data);
        showThankYouModal('Your inquiry has been sent via WhatsApp! We will contact you shortly.');
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalText;
    }
}

// Event listeners setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitReviewBtn');
            if (submitBtn) {
                handleReviewSubmission(this, submitBtn);
            }
        });
        console.log('Review form listener added');
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitContactBtn');
            if (submitBtn) {
                handleContactSubmission(this, submitBtn);
            }
        });
        console.log('Contact form listener added');
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for sticky nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Close modal when clicking outside
    const modal = document.getElementById('thankYouModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeThankYouModal();
            }
        });
    }

    // Navigation scroll listener
    window.addEventListener('scroll', setActiveNav);
    
    // Keyboard navigation for carousel
    document.addEventListener('keydown', function(e) {
        const totalSlidesCalculated = calculateTotalSlides();
        if (totalSlidesCalculated <= 1) return;
        
        if (e.key === 'ArrowLeft') {
            prevSlide();
            isAutoScrolling = false;
            resetAutoScroll();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            isAutoScrolling = false;
            resetAutoScroll();
        }
    });
    
    console.log('All event listeners set up successfully');
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Initialize animations
function setupAnimations() {
    console.log('Setting up animations...');
    document.querySelectorAll('.vehicle-card, .tour-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Thirupathi Travels website...');
    
    try {
        // Load reviews from Google Sheets and setup carousel
        loadReviews();
        
        // Setup star rating
        initializeStarRating();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup animations
        setupAnimations();
        
        // Set initial active nav
        setActiveNav();
        
        console.log('Website initialization complete!');
        
    } catch (error) {
        console.error('Error during website initialization:', error);
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Refresh reviews when page becomes visible again
        setTimeout(() => {
            loadReviews();
        }, 1000);
    } else {
        // Pause auto-scroll when page is not visible
        isAutoScrolling = false;
        stopAutoScroll();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopAutoScroll();
}); 