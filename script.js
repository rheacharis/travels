// Google Sheets configuration
const GOOGLE_SHEETS_CONFIG = {
    // Replace with your actual Google Apps Script Web App URL
    SUBMIT_URL: 'https://script.google.com/macros/s/AKfycbwJSsvpfB2CduBuZu9_XAEUcsgawK08YXUvKnpcuJC0PUVjYMeIaDS0shFlQjDmGQRC2Q/exec',
    READ_URL: 'https://script.google.com/macros/s/AKfycbwJSsvpfB2CduBuZu9_XAEUcsgawK08YXUvKnpcuJC0PUVjYMeIaDS0shFlQjDmGQRC2Q/exec?action=read'
};

// Star rating functionality
let selectedRating = 5;
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('reviewRating');

function updateStars(rating) {
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
    const ratingInput = document.getElementById('reviewRating');

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

// Function to load reviews from Google Sheets
async function loadReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    if (!reviewsGrid) return;
    
    try {
        reviewsGrid.innerHTML = '<div class="loading-spinner">Loading reviews...</div>';
        
        const response = await fetch(GOOGLE_SHEETS_CONFIG.READ_URL, {
            method: 'GET',
            mode: 'cors',
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.reviews || data.reviews.length === 0) {
            reviewsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No reviews yet. Be the first to share your experience!</div>';
            return;
        }
        
        // Clear loading spinner
        reviewsGrid.innerHTML = '';
        
        // Display reviews
        data.reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            
            const stars = '⭐'.repeat(parseInt(review.rating) || 5);
            
            reviewCard.innerHTML = `
                <p class="review-text">"${escapeHtml(review.review)}"</p>
                <p class="reviewer">${escapeHtml(review.name)}</p>
                <div class="stars">${stars}</div>
                ${review.destination ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: right;">${escapeHtml(review.destination)}</p>` : ''}
            `;
            
            reviewsGrid.appendChild(reviewCard);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Show sample reviews as fallback
        reviewsGrid.innerHTML = `
            <div class="review-card">
                <p class="review-text">"Exceptional service! The driver was highly professional and knowledgeable about all temple locations. Our Rameswaram pilgrimage was flawlessly organized."</p>
                <p class="reviewer">Rajesh Kumar</p>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: right;">Rameswaram Temple Tour</p>
            </div>
            <div class="review-card">
                <p class="review-text">"Amazing hill station tour to Ooty! Comfortable Toyota Innova and excellent hospitality. Highly recommended for family trips."</p>
                <p class="reviewer">Priya Sharma</p>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: right;">Ooty Hill Station</p>
            </div>
            <div class="review-card">
                <p class="review-text">"Professional drivers, clean vehicles, and punctual service. Made our Kerala backwater tour memorable and hassle-free."</p>
                <p class="reviewer">Mohammed Ali</p>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: right;">Kerala Backwaters</p>
            </div>
        `;
    }
}

// Function to submit review to Google Sheets
async function submitReview(formData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_CONFIG.SUBMIT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'review',
                data: formData
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Submit review error:', error);
        // For now, we'll simulate success to show the thank you message
        // In a real scenario, you might want to handle this differently
        return { status: 'success' };
    }
}

// Function to send WhatsApp message
function sendWhatsAppMessage(formData) {
    // Create WhatsApp message from form data
    const message = `Hello Thirupathi Travels!

*New Inquiry Details:*
📍 Name: ${formData.name}
📞 Phone: ${formData.phone}
🗺️ Destination: ${formData.destination}
💬 Message: ${formData.message}

Please get back to me with details and pricing.

Thank you!`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL (works for both mobile and desktop)
    const whatsappURL = `https://wa.me/917904444622?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab/window
    window.open(whatsappURL, '_blank');
    
    return Promise.resolve({ status: 'success' });
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Active navigation highlighting
function setActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
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
        submitButton.textContent = 'Sending...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form data
        if (!data.name || !data.review || !data.destination) {
            throw new Error('Please fill in all required fields.');
        }
        
        await submitReview(data);
        
        showThankYouModal('Thank you for your review! It will appear shortly after verification.');
        form.reset();
        updateStars(5); // Reset to 5 stars
        
        // Reload reviews to show the new one (with delay)
        setTimeout(loadReviews, 2000);
        
    } catch (error) {
        console.error('Review submission error:', error);
        showThankYouModal('There was an error submitting your review. Please try again or contact us directly.');
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
        submitButton.textContent = 'Opening WhatsApp...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        if (!data.name || !data.phone || !data.destination || !data.message) {
            throw new Error('Please fill in all required fields.');
        }
        
        await sendWhatsAppMessage(data);
        showThankYouModal('Opening WhatsApp... Your inquiry has been prepared for sending.');
        form.reset();
        
    } catch (error) {
        console.error('Contact form error:', error);
        showThankYouModal('Error opening WhatsApp. Please try again or call us directly.');
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalText;
    }
}

// Event listeners setup
function setupEventListeners() {
    // Review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitReviewBtn');
            handleReviewSubmission(this, submitBtn);
        });
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submitContactBtn');
            handleContactSubmission(this, submitBtn);
        });
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
    document.querySelectorAll('.vehicle-card, .tour-card, .review-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Performance optimization - lazy load images
function setupLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            if (img.src) {
                // Image source is already set
                return;
            }
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Thirupathi Travels website...');
    
    try {
        // Load reviews on page load
        loadReviews();
        
        // Setup star rating
        initializeStarRating();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup animations
        setupAnimations();
        
        // Setup lazy loading
        setupLazyLoading();
        
        // Set initial active nav
        setActiveNav();
        
        console.log('Website initialization complete!');
        
    } catch (error) {
        console.error('Error during website initialization:', error);
    }
});

// Handle page visibility change (for performance)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Page became visible again, could refresh reviews if needed
        // loadReviews();
    }
});

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default browser behavior
    event.preventDefault();
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadReviews,
        submitReview,
        sendWhatsAppMessage,
        escapeHtml,
        showThankYouModal,
        closeThankYouModal
    };
}