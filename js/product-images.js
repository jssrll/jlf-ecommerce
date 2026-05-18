// ========================================
// PRODUCT IMAGES
// Uses the provided ImageKit URL for all product images
// ========================================

const DEFAULT_PRODUCT_IMAGE = "https://ik.imagekit.io/0sf7uub8b/SAMURAI-FWORKS/Screenshot%202026-01-20%20124812.png?updatedAt=1768884573239";

// Map product IDs to specific images (optional - for future customization)
const productImageMap = {
    // Default: all products use the same image for now
    // Future: can add specific images per product
};

function getProductImage(productId, productName) {
    // Return default image for all products
    return DEFAULT_PRODUCT_IMAGE;
}

// Apply images to all product elements on the page
function applyProductImages() {
    // Apply to product cards in shop page
    const productCards = document.querySelectorAll('.product-card-apple');
    productCards.forEach(card => {
        const imgContainer = card.querySelector('.product-img-apple');
        const productId = card.getAttribute('data-id');
        
        if (imgContainer && !imgContainer.querySelector('img')) {
            // Check if it already has an image
            const existingImg = imgContainer.querySelector('img');
            if (!existingImg) {
                const img = document.createElement('img');
                img.src = getProductImage(productId, '');
                img.alt = 'Firework product';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '16px';
                
                // Move the emoji icon to background or replace
                const emojiSpan = imgContainer.querySelector('.emoji-icon');
                if (emojiSpan) {
                    emojiSpan.style.display = 'none';
                }
                
                imgContainer.innerHTML = '';
                imgContainer.appendChild(img);
            }
        }
    });
    
    // Apply to showcase items on home page
    const showcaseItems = document.querySelectorAll('.showcase-item');
    showcaseItems.forEach(item => {
        const iconContainer = item.querySelector('.showcase-icon');
        if (iconContainer && !iconContainer.querySelector('img')) {
            const existingImg = iconContainer.querySelector('img');
            if (!existingImg && iconContainer.textContent.trim() !== '') {
                // Store the emoji text
                const emoji = iconContainer.textContent;
                iconContainer.textContent = '';
                
                const img = document.createElement('img');
                img.src = DEFAULT_PRODUCT_IMAGE;
                img.alt = 'Firework product';
                img.style.width = '60px';
                img.style.height = '60px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '12px';
                img.style.display = 'block';
                img.style.margin = '0 auto';
                
                iconContainer.appendChild(img);
                
                // Add a small emoji badge
                const emojiBadge = document.createElement('span');
                emojiBadge.textContent = emoji;
                emojiBadge.style.position = 'absolute';
                emojiBadge.style.bottom = '5px';
                emojiBadge.style.right = '5px';
                emojiBadge.style.fontSize = '1rem';
                emojiBadge.style.background = 'rgba(0,0,0,0.5)';
                emojiBadge.style.borderRadius = '50%';
                emojiBadge.style.width = '24px';
                emojiBadge.style.height = '24px';
                emojiBadge.style.display = 'flex';
                emojiBadge.style.alignItems = 'center';
                emojiBadge.style.justifyContent = 'center';
                iconContainer.style.position = 'relative';
                iconContainer.appendChild(emojiBadge);
            }
        }
    });
    
    // Apply to cart items
    const cartItems = document.querySelectorAll('.cart-item-img');
    cartItems.forEach(item => {
        if (!item.querySelector('img')) {
            const img = document.createElement('img');
            img.src = DEFAULT_PRODUCT_IMAGE;
            img.alt = 'Product';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '12px';
            
            const emojiSpan = item.querySelector('.emoji-icon');
            if (emojiSpan) {
                emojiSpan.style.display = 'none';
            }
            
            item.innerHTML = '';
            item.appendChild(img);
        }
    });
}

// Observe DOM changes to apply images to dynamically added elements
function observeProductImages() {
    const observer = new MutationObserver(() => {
        applyProductImages();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize product images when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        applyProductImages();
        observeProductImages();
    }, 500);
});

// Re-apply images when cart is rendered
if (typeof renderCartUI === 'function') {
    const originalRenderCartUI = renderCartUI;
    window.renderCartUI = function() {
        originalRenderCartUI();
        setTimeout(applyProductImages, 100);
    };
}