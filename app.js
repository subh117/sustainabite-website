// SustainaBite JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion functionality
    initFAQ();
    
    // Food ordering functionality
    initFoodOrdering();
    
    // Partner form functionality
    initPartnerForm();
    
    // Smooth scrolling for navigation
    initSmoothScrolling();
    
    // Initialize cart
    initCart();
    
    // Initialize stats animation
    initStatsAnimation();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Add scroll to top
    addScrollToTop();
    
    // Add interactive hover effects
    addHoverEffects();
});

// FAQ Accordion - Fixed
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', (e) => {
                e.preventDefault();
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        }
    });
}

// Food ordering system - Enhanced with better filtering
function initFoodOrdering() {
    const searchInput = document.getElementById('food-search');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const priceFilter = document.getElementById('price-filter');
    const sourceFilter = document.getElementById('source-filter');
    const dietaryFilter = document.getElementById('dietary-filter');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', filterFoodItems);
    }
    
    // Filter functionality
    [cuisineFilter, priceFilter, sourceFilter, dietaryFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', filterFoodItems);
        }
    });
    
    function filterFoodItems() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCuisine = cuisineFilter ? cuisineFilter.value : '';
        const selectedPriceRange = priceFilter ? priceFilter.value : '';
        const selectedSource = sourceFilter ? sourceFilter.value : '';
        const selectedDietary = dietaryFilter ? dietaryFilter.value : '';
        
        const foodCards = document.querySelectorAll('.food-card');
        
        foodCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const cuisine = card.dataset.cuisine || '';
            const price = parseInt(card.dataset.price) || 0;
            const source = card.dataset.source || '';
            const dietary = card.dataset.dietary || '';
            
            let showCard = true;
            
            // Search filter
            if (searchTerm && !title.includes(searchTerm)) {
                showCard = false;
            }
            
            // Cuisine filter
            if (selectedCuisine && cuisine !== selectedCuisine) {
                showCard = false;
            }
            
            // Price filter
            if (selectedPriceRange) {
                if (selectedPriceRange === '0-100' && price > 100) {
                    showCard = false;
                } else if (selectedPriceRange === '100-200' && (price <= 100 || price > 200)) {
                    showCard = false;
                } else if (selectedPriceRange === '200+' && price <= 200) {
                    showCard = false;
                }
            }
            
            // Source filter
            if (selectedSource && source !== selectedSource) {
                showCard = false;
            }
            
            // Dietary filter
            if (selectedDietary && !dietary.includes(selectedDietary)) {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
        });
    }
}

// Shopping cart functionality - Fixed
let cart = [];

function initCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const foodCard = this.closest('.food-card');
            const id = this.dataset.id;
            const name = foodCard.querySelector('h3').textContent;
            const priceText = foodCard.querySelector('.our-price').textContent;
            const price = parseInt(priceText.replace('₹', ''));
            const source = foodCard.querySelector('.food-source').textContent.replace('Source: ', '');
            
            addToCart({ id, name, price, source });
            updateCartDisplay();
        });
    });
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            checkout();
        });
    }
    
    // Initial cart display
    updateCartDisplay();
}

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    // Show success feedback
    showNotification(`${item.name} added to cart!`, 'success');
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    showNotification('Item removed from cart', 'info');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.source}</small><br>
                <small>₹${item.price} x ${item.quantity} = ₹${itemTotal}</small>
            </div>
            <div>
                <button onclick="changeQuantity('${item.id}', -1)" class="btn btn--sm btn--outline">-</button>
                <span style="margin: 0 8px;">${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)" class="btn btn--sm btn--outline">+</button>
                <button onclick="removeFromCart('${item.id}')" class="btn btn--sm" style="margin-left: 8px; background: #f44336; color: white;">×</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `Total: ₹${total}`;
    
    // Show/hide checkout button based on cart contents
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.style.display = cart.length > 0 ? 'block' : 'none';
    }
}

function changeQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartDisplay();
        }
    }
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Simulate checkout process
    showNotification('Processing your order...', 'info');
    
    setTimeout(() => {
        showNotification(`Order confirmed! ${itemCount} items for ₹${total}. Thank you for choosing SustainaBite!`, 'success');
        cart = [];
        updateCartDisplay();
    }, 2000);
}

// Partner form functionality - Fixed
function initPartnerForm() {
    const partnerForm = document.getElementById('partner-form');
    
    if (partnerForm) {
        partnerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const businessName = document.getElementById('business-name').value;
            const businessType = document.getElementById('business-type').value;
            const contactPerson = document.getElementById('contact-person').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // Validate form
            if (!businessName || !businessType || !contactPerson || !email || !phone) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Phone validation (basic)
            const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
            if (!phoneRegex.test(phone)) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Submitting your partnership application...', 'info');
            
            setTimeout(() => {
                showNotification(`Thank you ${contactPerson}! Your partnership application has been submitted. We'll contact you at ${email} within 24 hours.`, 'success');
                this.reset();
            }, 1500);
        });
    }
}

// Smooth scrolling for navigation - Fixed
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('nav a[href^="#"], .hero-buttons a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight || 80;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 350px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Add CSS animations if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function getNotificationColor(type) {
    const colors = {
        'success': '#4CAF50',
        'error': '#f44336',
        'warning': '#FF9800',
        'info': '#2196F3'
    };
    return colors[type] || colors.info;
}

// Impact stats animation on scroll
function initStatsAnimation() {
    const stats = document.querySelectorAll('.impact-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                animateNumber(entry.target);
                entry.target.dataset.animated = 'true';
            }
        });
    });
    
    stats.forEach(stat => observer.observe(stat));
}

function animateNumber(element) {
    const target = parseInt(element.textContent.replace(/,/g, ''));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Mobile menu toggle
function initMobileMenu() {
    const nav = document.querySelector('.nav ul');
    const header = document.querySelector('.header .container');
    
    // Create mobile menu toggle button
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '☰';
    navToggle.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
    `;
    
    // Add toggle button to header
    const navWrapper = document.querySelector('.nav-wrapper');
    if (navWrapper) {
        navWrapper.appendChild(navToggle);
    }
    
    // Toggle functionality
    navToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });
    
    // Close menu when clicking on links
    nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            nav.classList.remove('nav-open');
        }
    });
}

// Add interactive hover effects
function addHoverEffects() {
    const benefitCards = document.querySelectorAll('.benefit-card, .safety-item');
    
    benefitCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Scroll to top functionality
function addScrollToTop() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #4CAF50;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(scrollButton);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
        } else {
            scrollButton.style.opacity = '0';
        }
    });
    
    scrollButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Food item detail modal
function showFoodDetails(foodId) {
    const foodCards = document.querySelectorAll('.food-card');
    let foodCard = null;
    
    foodCards.forEach(card => {
        if (card.querySelector('.add-to-cart').dataset.id === foodId) {
            foodCard = card;
        }
    });
    
    if (!foodCard) return;
    
    const name = foodCard.querySelector('h3').textContent;
    const source = foodCard.querySelector('.food-source').textContent.replace('Source: ', '');
    const price = foodCard.querySelector('.our-price').textContent;
    const originalPrice = foodCard.querySelector('.original-price').textContent;
    const inspection = foodCard.querySelector('.inspection-info').textContent.replace('Inspected: ', '');
    const available = foodCard.querySelector('.available').textContent;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2>${name}</h2>
            <div class="food-detail-info">
                <p><strong>Source:</strong> ${source}</p>
                <p><strong>Original Price:</strong> ${originalPrice}</p>
                <p><strong>Our Price:</strong> ${price}</p>
                <p><strong>Safety Inspection:</strong> ${inspection}</p>
                <p><strong>Availability:</strong> ${available}</p>
                <p><strong>Food Safety Status:</strong> ✅ Passed all safety checks</p>
                <p><strong>Temperature Maintained:</strong> ✅ Proper cold chain maintained</p>
                <p><strong>Packaging:</strong> ✅ Sealed and hygienic</p>
            </div>
            <button class="btn btn--primary btn--full-width modal-add-to-cart" data-id="${foodId}">Add to Cart</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Add to cart from modal
    const modalAddBtn = modal.querySelector('.modal-add-to-cart');
    modalAddBtn.onclick = (e) => {
        e.preventDefault();
        const addBtn = foodCard.querySelector('.add-to-cart');
        addBtn.click();
        modal.remove();
    };
}