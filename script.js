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
    ratingInput.value = rating;
}

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

// Function to load reviews from Google Sheets
async function loadReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    try {
        reviewsGrid.innerHTML = '<div class="loading-spinner">Loading reviews...</div>';
        
        const response = await fetch(GOOGLE_SHEETS_CONFIG.READ_URL);
        
        if (!response.ok) {
            throw new Error('Failed to load reviews');
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
        reviewsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="review-card">
                    <p class="review-text">"Exceptional service! The driver was highly professional and knowledgeable about all temple locations. Our Rameswaram pilgrimage was flawlessly organized."</p>
                    <p class="reviewer">Rajesh Kumar</p>
                    <div class="stars">⭐⭐⭐⭐⭐</div>
                </div>
            </div>
        `;
    }
}

// Function to submit review to Google Sheets
async function submitReview(formData) {
    const response = await fetch(GOOGLE_SHEETS_CONFIG.SUBMIT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'review',
            data: formData
        })
    });

    if (!response.ok) {
        throw new Error('Failed to submit review');
    }

    return await response.json();
}

// Function to submit contact form to Google Sheets
function sendWhatsAppMessage(formData) {
    // Create WhatsApp message from form data
    const message = `Hello Thirupathi Travels!

*New Inquiry Details:*
📝 Name: ${formData.name}
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

window.addEventListener('scroll', setActiveNav);
document.addEventListener('DOMContentLoaded', setActiveNav);

// Form submission handlers
async function handleReviewSubmission(form, submitButton, successMessage) {
    const originalText = submitButton.textContent;
    
    try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Sending...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        await submitReview(data);
        
        showMessage(successMessage, 'success');
        form.reset();
        updateStars(5); // Reset to 5 stars
        
        // Reload reviews to show the new one
        setTimeout(loadReviews, 1000);
        
    } catch (error) {
        console.error('Review submission error:', error);
        showMessage('There was an error submitting your review. Please try again or contact us directly.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalText;
    }
}

function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = text;

    // Insert after the form that was submitted
    const activeForm = document.activeElement.closest('form');
    if (activeForm) {
        activeForm.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Review form submission
document.getElementById('reviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    handleReviewSubmission(
        this, 
        document.getElementById('submitReviewBtn'), 
        'Thank you for your review! It will appear shortly after verification.'
    );
});

// Contact form submission
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Validate required fields
    if (!data.name || !data.phone || !data.destination || !data.message) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    try {
        sendWhatsAppMessage(data);
        showMessage('Redirecting to WhatsApp...', 'success');
        this.reset(); // Clear the form
    } catch (error) {
        console.error('WhatsApp redirect error:', error);
        showMessage('Error opening WhatsApp. Please try again.', 'error');
    }
});

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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load reviews on page load
    loadReviews();
    
    // Setup animations
    document.querySelectorAll('.vehicle-card, .tour-card, .review-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Performance optimization - lazy load images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}