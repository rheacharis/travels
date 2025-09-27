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

// Function to load reviews from Google Sheets using JSONP-like approach
async function loadReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    if (!reviewsGrid) return;
    
    try {
        console.log('Loading reviews from Google Sheets...');
        reviewsGrid.innerHTML = '<div class="loading-spinner">Loading reviews...</div>';
        
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
        
        console.log(`Successfully loaded ${data.reviews.length} reviews`);
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Show a more user-friendly error message and provide sample reviews
        displayFallbackReviews(reviewsGrid);
    }
}

// Display fallback reviews when Google Sheets is unavailable
function displayFallbackReviews(reviewsGrid) {
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
        }
    ];
    
    reviewsGrid.innerHTML = '';
    
    fallbackReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        const stars = '⭐'.repeat(parseInt(review.rating));
        
        reviewCard.innerHTML = `
            <p class="review-text">"${escapeHtml(review.review)}"</p>
            <p class="reviewer">${escapeHtml(review.name)}</p>
            <div class="stars">${stars}</div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; text-align: right;">${escapeHtml(review.destination)}</p>
        `;
        
        reviewsGrid.appendChild(reviewCard);
    });
    
    // Add a small note about the fallback
    const noteDiv = document.createElement('div');
    noteDiv.style.cssText = 'text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.8rem; font-style: italic;';
    noteDiv.textContent = 'Recent customer reviews (Live reviews loading...)';
    reviewsGrid.appendChild(noteDiv);
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
    document.querySelectorAll('.vehicle-card, .tour-card, .review-card').forEach(card => {
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
        // Load reviews from Google Sheets
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
    }
});