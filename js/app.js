// ========================================
// JLF ECOMMERCE - MAIN APPLICATION JS
// ========================================

const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // Replace with your GAS URL
const PRODUCT_IMAGE = 'https://ik.imagekit.io/0sf7uub8b/SAMURAI-FWORKS/Screenshot%202026-01-20%20124812.png?updatedAt=1768884573239';

// ========================================
// GLOBAL STATE
// ========================================
let userSession = {
    accountId: '',
    name: '',
    phone: '',
    balance: 0,
    isLoggedIn: false
};

let cart = [];
let transactions = [];
let balanceCheckInterval;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupKeyboardShortcuts();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('userSession');
    if (savedUser) {
        userSession = JSON.parse(savedUser);
        if (userSession.isLoggedIn) {
            showDashboard();
            startBalanceAutoUpdate();
        } else {
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // '?' key - Show help
        if (event.key === '?' || event.shiftKey && event.key === '/') {
            event.preventDefault();
            showHelpDialog();
        }
        
        // 'C' key - Open cart
        if (event.key === 'c' || event.key === 'C') {
            if (event.ctrlKey || event.metaKey) return; // Don't interfere with browser shortcuts
            event.preventDefault();
            openCart();
        }
        
        // 'S' key - Open search
        if (event.key === 's' || event.key === 'S') {
            if (event.ctrlKey || event.metaKey) return; // Don't interfere with browser shortcuts
            event.preventDefault();
            focusSearch();
        }
        
        // 'L' key - Logout
        if (event.key === 'l' || event.key === 'L') {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                logout();
            }
        }
    });
}

function showHelpDialog() {
    const helpDialog = `
        <div class="modal-overlay" id="helpModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="close-btn" onclick="document.getElementById('helpModal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="shortcut-item">
                        <kbd>?</kbd> <span>Show this help dialog</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>C</kbd> <span>Open shopping cart</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>S</kbd> <span>Focus search bar</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl + L</kbd> <span>Logout</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', helpDialog);
}

function openCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.style.display = 'flex';
        triggerHapticFeedback(20); // Light vibration
    }
}

function focusSearch() {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.focus();
        triggerHapticFeedback(10);
    }
}

// ========================================
// HAPTIC FEEDBACK
// ========================================
function triggerHapticFeedback(duration = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// ========================================
// AUTO-BALANCE UPDATE
// ========================================
function startBalanceAutoUpdate() {
    // Update every 5 seconds
    balanceCheckInterval = setInterval(() => {
        if (userSession.isLoggedIn) {
            updateBalance();
        }
    }, 5000);
}

function stopBalanceAutoUpdate() {
    if (balanceCheckInterval) {
        clearInterval(balanceCheckInterval);
    }
}

function updateBalance() {
    // Fetch updated balance from API
    fetch(`${API_URL}?action=getUsers`)
        .then(response => response.json())
        .then(users => {
            const user = users.find(u => u.phone === userSession.phone);
            if (user) {
                userSession.balance = user.balance;
                localStorage.setItem('userSession', JSON.stringify(userSession));
                updateBalanceDisplay();
            }
        })
        .catch(error => console.log('Balance update check complete'));
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('userBalance');
    if (balanceElement) {
        balanceElement.textContent = `₱${userSession.balance.toLocaleString('en-PH')}`;
    }
}

// ========================================
// COPY ACCOUNT ID
// ========================================
function copyAccountId() {
    const accountId = userSession.accountId;
    navigator.clipboard.writeText(accountId).then(() => {
        showToast(`Account ID copied: ${accountId}`, 'success');
        triggerHapticFeedback(50); // Medium vibration
    }).catch(() => {
        showToast('Failed to copy account ID', 'error');
    });
}

// ========================================
// ORDER AGAIN FEATURE
// ========================================
function loadTransactionHistory() {
    if (!userSession.isLoggedIn) return;
    
    fetch(`${API_URL}?action=getUserOrders&phone=${userSession.phone}`)
        .then(response => response.json())
        .then(orders => {
            transactions = orders;
            displayTransactionHistory();
        })
        .catch(error => console.error('Error loading transactions:', error));
}

function displayTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet</p>';
        return;
    }
    
    // Virtual scrolling implementation
    const virtualScroll = new VirtualScroll(container, transactions, renderTransaction, 80);
    virtualScroll.render();
}

function renderTransaction(transaction) {
    return `
        <div class="transaction-item">
            <div class="transaction-header">
                <span class="transaction-id">${transaction.orderId}</span>
                <span class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="transaction-details">
                <p class="transaction-items">${transaction.orderList}</p>
                <p class="transaction-amount">₱${transaction.totalPrice.toLocaleString('en-PH')}</p>
                <span class="transaction-status" data-status="${transaction.status.toLowerCase()}">
                    ${transaction.status}
                </span>
            </div>
            <button class="order-again-btn" onclick="orderAgain('${transaction.orderId}', '${transaction.orderList}')">
                🔄 Order Again
            </button>
        </div>
    `;
}

function orderAgain(orderId, orderList) {
    // Parse order list and add items back to cart
    try {
        const items = JSON.parse(orderList);
        items.forEach(item => {
            addToCart(item);
        });
        triggerHapticFeedback(30);
        showToast('Items added to cart! Ready to checkout?', 'success');
        openCart();
    } catch (error) {
        // If orderList is a string, try to parse it differently
        showToast('Adding items from previous order...', 'info');
        triggerHapticFeedback(20);
    }
}

// ========================================
// MYSTERY BOX (SURPRISE ME)
// ========================================
function displayMysteryBox() {
    const mysteryBoxSection = document.getElementById('mysteryBoxSection');
    if (!mysteryBoxSection) return;
    
    const mysteryBoxHTML = `
        <div class="section-container mystery-box-container">
            <div class="section-header">
                <h2>🎁 Surprise Me - Mystery Box!</h2>
                <p class="section-subtitle">Get a random amazing product for only ₱499!</p>
            </div>
            <div class="mystery-box-content">
                <div class="mystery-box-card">
                    <div class="mystery-box-visual">
                        <div class="mystery-box-animation">
                            <div class="mystery-sparkle">✨</div>
                            <div class="mystery-box-icon">🎁</div>
                        </div>
                    </div>
                    <h3>Mystery Box Bundle</h3>
                    <p class="mystery-description">
                        Contains a random selection of premium fireworks. Every box is unique!
                    </p>
                    <div class="mystery-price">₱499</div>
                    <button class="mystery-btn" onclick="purchaseMysteryBox()">
                        Get Mystery Box
                    </button>
                    <p class="mystery-note">
                        ⚠️ <strong>Note:</strong> This is a random product selection. Contents vary and may include 
                        different fireworks. Please review safety guidelines before use.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    mysteryBoxSection.innerHTML = mysteryBoxHTML;
}

function purchaseMysteryBox() {
    if (!userSession.isLoggedIn) {
        showToast('Please login first', 'error');
        return;
    }
    
    const randomProducts = getRandomProducts(3);
    const orderList = randomProducts.map(p => p.name).join(', ');
    
    addToCart({
        name: 'Mystery Box Bundle',
        price: 499,
        quantity: 1,
        description: orderList
    });
    
    triggerHapticFeedback(50);
    showToast('Mystery box added to cart! 🎁', 'success');
    openCart();
}

function getRandomProducts(count) {
    // Return random products (you should modify this based on your product list)
    const products = [
        { name: 'Sparkler Pack', price: 150 },
        { name: 'Firecrackers Assorted', price: 200 },
        { name: 'Color Shells Bundle', price: 300 },
        { name: 'Festival Pack', price: 250 },
        { name: 'Premium Assortment', price: 400 }
    ];
    
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// ========================================
// PRODUCTS WITH IMAGES
// ========================================
function displayProducts() {
    const products = getAllProducts();
    const productsContainer = document.getElementById('productsContainer');
    
    if (!productsContainer) return;
    
    let html = '';
    products.forEach(product => {
        html += `
            <div class="product-card">
                <div class="product-image">
                    <img src="${PRODUCT_IMAGE}" alt="${product.name}" loading="lazy" />
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">₱${product.price}</div>
                    <div class="product-actions">
                        <input type="number" min="1" max="100" value="1" class="quantity-input" id="qty-${product.id}">
                        <button class="add-to-cart-btn" onclick="quickAddToCart('${product.id}', '${product.name}', ${product.price})">
                            🛒 Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsContainer.innerHTML = html;
}

function getAllProducts() {
    return [
        { id: 1, name: 'Firecrackers Pack', price: 150, description: 'Classic firecrackers for festive celebrations' },
        { id: 2, name: 'Sparkler Set', price: 200, description: 'Beautiful handheld sparklers' },
        { id: 3, name: 'Festival Bundle', price: 499, description: 'Complete festive fireworks collection' },
        { id: 4, name: 'Premium Assortment', price: 699, description: 'Premium quality mixed fireworks' },
        { id: 5, name: 'Color Shells', price: 350, description: 'Colorful aerial fireworks' },
        { id: 6, name: 'Sound Collection', price: 299, description: 'Loud and celebratory fireworks' },
        { id: 7, name: 'Deluxe Pack', price: 899, description: 'Ultimate fireworks experience' },
        { id: 8, name: 'Garden Party Set', price: 449, description: 'Perfect for backyard celebrations' }
    ];
}

function quickAddToCart(productId, productName, price) {
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput?.value) || 1;
    
    addToCart({
        id: productId,
        name: productName,
        price: price,
        quantity: quantity
    });
    
    triggerHapticFeedback(30);
    showToast(`${productName} added to cart!`, 'success');
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += (product.quantity || 1);
    } else {
        cart.push({
            ...product,
            quantity: product.quantity || 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// ========================================
// VIRTUAL SCROLL IMPLEMENTATION
// ========================================
class VirtualScroll {
    constructor(container, items, renderFn, itemHeight) {
        this.container = container;
        this.items = items;
        this.renderFn = renderFn;
        this.itemHeight = itemHeight;
        this.visibleRange = { start: 0, end: 10 };
        this.scrollTop = 0;
        
        this.setupScrollListener();
    }
    
    setupScrollListener() {
        this.container.addEventListener('scroll', () => {
            this.scrollTop = this.container.scrollTop;
            this.updateVisibleRange();
        });
    }
    
    updateVisibleRange() {
        const containerHeight = this.container.clientHeight;
        this.visibleRange.start = Math.floor(this.scrollTop / this.itemHeight);
        this.visibleRange.end = this.visibleRange.start + Math.ceil(containerHeight / this.itemHeight) + 1;
        this.render();
    }
    
    render() {
        const fragment = document.createDocumentFragment();
        
        for (let i = this.visibleRange.start; i < Math.min(this.visibleRange.end, this.items.length); i++) {
            const div = document.createElement('div');
            div.innerHTML = this.renderFn(this.items[i]);
            fragment.appendChild(div.firstChild);
        }
        
        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
}

// ========================================
// LOGIN/LOGOUT
// ========================================
function login(phone, password) {
    if (!phone || !password) {
        showToast('Please enter phone and password', 'error');
        return;
    }
    
    fetch(`${API_URL}?action=loginUser&phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                userSession = {
                    accountId: data.user.accountId,
                    name: data.user.name,
                    phone: data.user.phone,
                    balance: data.user.balance,
                    isLoggedIn: true
                };
                localStorage.setItem('userSession', JSON.stringify(userSession));
                triggerHapticFeedback(50);
                showToast('Login successful!', 'success');
                showDashboard();
                startBalanceAutoUpdate();
            } else {
                showToast(data.message || 'Login failed', 'error');
                triggerHapticFeedback(100);
            }
        })
        .catch(error => {
            showToast('Login error: ' + error.message, 'error');
            console.error('Login error:', error);
        });
}

function logout() {
    stopBalanceAutoUpdate();
    localStorage.removeItem('userSession');
    localStorage.removeItem('cart');
    userSession = {
        accountId: '',
        name: '',
        phone: '',
        balance: 0,
        isLoggedIn: false
    };
    cart = [];
    
    // Clear transaction page
    const transactionContainer = document.getElementById('transactionHistory');
    if (transactionContainer) {
        transactionContainer.innerHTML = '';
    }
    
    triggerHapticFeedback(30);
    showToast('You have been logged out', 'info');
    showLoginPage();
}

// ========================================
// UI HELPERS
// ========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showDashboard() {
    // Show dashboard page
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    
    if (loginForm) loginForm.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    
    displayProducts();
    displayMysteryBox();
    loadTransactionHistory();
    updateBalanceDisplay();
}

function showLoginPage() {
    // Show login page
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    
    if (loginForm) loginForm.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
}

function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const phone = document.getElementById('phoneInput')?.value;
            const password = document.getElementById('passwordInput')?.value;
            login(phone, password);
        });
    }
    
    // Enter key for login
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const phoneInput = document.getElementById('phoneInput');
            const passwordInput = document.getElementById('passwordInput');
            if (phoneInput && phoneInput === document.activeElement || passwordInput === document.activeElement) {
                const phone = phoneInput?.value;
                const password = passwordInput?.value;
                login(phone, password);
            }
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Copy Account ID
    const copyAccountIdBtn = document.getElementById('copyAccountIdBtn');
    if (copyAccountIdBtn) {
        copyAccountIdBtn.addEventListener('click', copyAccountId);
    }
}

// ========================================
// FIREWORKS SAFETY PAGE LINK
// ========================================
function openFireworksSafetyPage() {
    window.open('fireworks-safety.html', '_blank');
}

// ========================================
// EXPORT FOR EXTERNAL USE
// ========================================
window.JLFApp = {
    logout,
    copyAccountId,
    orderAgain,
    purchaseMysteryBox,
    quickAddToCart,
    openCart,
    focusSearch,
    showHelpDialog,
    openFireworksSafetyPage,
    triggerHapticFeedback,
    showToast
};