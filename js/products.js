// ============================================
// JLF FIREWORKS - PRODUCTS MODULE
// Readable, unminified version
// ============================================

// Products data
let products = [];

// Product categories
const categories = ['Aerial', 'Ground', 'Sparklers', 'Fountains', 'Others'];

// Initialize products
function initProducts() {
    loadProducts();
    setupCategoryFilters();
    setupSearchInput();
    setupClearSearchButton();
}

// Load products from localStorage or use default
function loadProducts() {
    const savedProducts = loadFromLocalStorage('jlf_products');
    
    if (savedProducts && savedProducts.length > 0) {
        products = savedProducts;
    } else {
        // Default products data
        products = [
            { id: 1, name: 'Maribel Kwitis', price: 129, category: 'Aerial', description: 'Classic kwitis fireworks', image: '🧨', stock: 100 },
            { id: 2, name: 'Sparklers 10pcs', price: 49, category: 'Sparklers', description: 'Safe and fun sparklers', image: '✨', stock: 200 },
            { id: 3, name: 'Fountain Gold', price: 299, category: 'Fountains', description: 'Beautiful gold fountain display', image: '🌋', stock: 50 },
            { id: 4, name: 'Roman Candle 10 Shots', price: 159, category: 'Aerial', description: 'Multi-shot aerial display', image: '🕯️', stock: 75 },
            { id: 5, name: 'TS Thunder Sawa 500 Rounds', price: 749, category: 'Ground', description: '500 rounds thunder sawa', image: '🧨', stock: 30 },
            { id: 6, name: 'TS Special DK Sawa 500 Rounds', price: 789, category: 'Ground', description: 'Special DK sawa 500 rounds', image: '🧨', stock: 25 },
            { id: 7, name: 'TS Super Thunder Sawa 500 Rounds', price: 799, category: 'Ground', description: 'Super thunder sawa 500 rounds', image: '🧨', stock: 20 },
            { id: 8, name: 'Vulcan 100 Rounds', price: 399, category: 'Ground', description: '100 rounds ground display', image: '🌋', stock: 60 },
            { id: 9, name: 'Butterfly Fountain', price: 89, category: 'Fountains', description: 'Butterfly shaped fountain', image: '🦋', stock: 150 },
            { id: 10, name: 'Whistle Bomb', price: 29, category: 'Aerial', description: 'Loud whistle bomb', image: '💣', stock: 300 }
        ];
        saveToLocalStorage('jlf_products', products);
    }
    
    renderProducts(products);
}

// Render products to the page
function renderProducts(productsToRender) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (!productsToRender || productsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>No products found</p>
                <button class="btn-secondary-apple" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    for (const product of productsToRender) {
        html += `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <span class="product-emoji">${product.image || '🧨'}</span>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-description">${escapeHtml(product.description || 'Premium firework')}</p>
                    <div class="product-category">
                        <span class="category-badge ${product.category.toLowerCase()}">${product.category}</span>
                    </div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock ${product.stock < 10 ? 'low-stock' : ''}">
                        ${product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                    </div>
                    <button class="btn-add-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Filter products based on search and category
function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const activeCategory = document.querySelector('.cat-btn-apple.active')?.getAttribute('data-cat') || 'all';
    
    let filtered = [...products];
    
    // Filter by category
    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderProducts(filtered);
}

// Reset all filters
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
    }
    
    const allBtn = document.querySelector('.cat-btn-apple[data-cat="all"]');
    if (allBtn) {
        document.querySelectorAll('.cat-btn-apple').forEach(btn => btn.classList.remove('active'));
        allBtn.classList.add('active');
    }
    
    renderProducts(products);
}

// Setup category filter buttons
function setupCategoryFilters() {
    const categoryContainer = document.getElementById('categoryFilter');
    if (!categoryContainer) return;
    
    // Add click handlers to existing buttons
    const buttons = categoryContainer.querySelectorAll('.cat-btn-apple');
    buttons.forEach(btn => {
        btn.removeEventListener('click', handleCategoryClick);
        btn.addEventListener('click', handleCategoryClick);
    });
}

// Handle category button click
function handleCategoryClick(e) {
    const btn = e.currentTarget;
    const category = btn.getAttribute('data-cat');
    
    // Update active state
    document.querySelectorAll('.cat-btn-apple').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Filter products
    filterProducts();
}

// Setup search input with debounce
function setupSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Remove existing listener to avoid duplicates
    searchInput.removeEventListener('input', handleSearchInput);
    searchInput.addEventListener('input', handleSearchInput);
}

// Handle search input with debounce
let searchTimeout;
function handleSearchInput(e) {
    const clearBtn = document.getElementById('clearSearchBtn');
    
    // Show/hide clear button
    if (clearBtn) {
        if (e.target.value.length > 0) {
            clearBtn.style.display = 'flex';
        } else {
            clearBtn.style.display = 'none';
        }
    }
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterProducts();
    }, 300);
}

// Setup clear search button
function setupClearSearchButton() {
    const clearBtn = document.getElementById('clearSearchBtn');
    if (!clearBtn) return;
    
    clearBtn.removeEventListener('click', handleClearSearch);
    clearBtn.addEventListener('click', handleClearSearch);
}

// Handle clear search
function handleClearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        filterProducts();
    }
}

// Add product to cart (called from HTML buttons)
function addToCart(productId) {
    if (!isLoggedIn()) {
        showToast('Please login first to add items to cart');
        openAccountModal();
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found');
        return;
    }
    
    if (product.stock <= 0) {
        showToast('Product is out of stock');
        return;
    }
    
    // Get current cart
    let cart = loadFromLocalStorage('jlf_cart', []);
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`${product.name} quantity updated`);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
        showToast(`${product.name} added to cart`);
    }
    
    // Save cart
    saveToLocalStorage('jlf_cart', cart);
    updateCartBadge();
    updateCartDisplay();
}

// Get product by ID
function getProductById(productId) {
    return products.find(p => p.id === productId);
}

// Admin: Add new product
function addProduct(productData) {
    if (!isAdmin()) {
        showToast('Admin access required');
        return false;
    }
    
    const newProduct = {
        id: Date.now(),
        name: productData.name,
        price: parseFloat(productData.price),
        category: productData.category,
        description: productData.description || '',
        image: productData.image || '🧨',
        stock: parseInt(productData.stock) || 0,
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    saveToLocalStorage('jlf_products', products);
    renderProducts(products);
    showToast('Product added successfully');
    return true;
}

// Admin: Update product
function updateProduct(productId, productData) {
    if (!isAdmin()) {
        showToast('Admin access required');
        return false;
    }
    
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
        showToast('Product not found');
        return false;
    }
    
    products[index] = {
        ...products[index],
        name: productData.name || products[index].name,
        price: parseFloat(productData.price) || products[index].price,
        category: productData.category || products[index].category,
        description: productData.description || products[index].description,
        stock: parseInt(productData.stock) || products[index].stock
    };
    
    saveToLocalStorage('jlf_products', products);
    renderProducts(products);
    showToast('Product updated successfully');
    return true;
}

// Admin: Delete product
function deleteProduct(productId) {
    if (!isAdmin()) {
        showToast('Admin access required');
        return false;
    }
    
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        saveToLocalStorage('jlf_products', products);
        renderProducts(products);
        showToast('Product deleted successfully');
        return true;
    }
    return false;
}

// Update product stock after order
function updateProductStock(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.stock -= quantity;
        if (product.stock < 0) product.stock = 0;
        saveToLocalStorage('jlf_products', products);
        
        // Re-render if on shop page
        if (document.getElementById('shopPage')?.classList.contains('active')) {
            filterProducts();
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize products when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initProducts();
});