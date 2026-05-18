// ========================================
// PRODUCT DISPLAY - WITH MYSTERY BOX AS PRODUCT
// ========================================

// Add Mystery Box to products array
const mysteryBoxProduct = {
    id: 9999,
    name: "🎁 Surprise Me Mystery Box",
    category: "Mystery",
    price: 499,
    image: "🎁",
    description: "Random product from our collection! Get a surprise fireworks item worth up to ₱799!"
};

// Add to products array if not already there
if (!products.find(p => p.id === 9999)) {
    products.push(mysteryBoxProduct);
}

function getFilteredProducts() {
    let filtered = [...products];
    if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
    if (searchQuery.trim() !== "") {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered;
}

function renderProducts() {
    if (isAdmin) return;
    const container = document.getElementById("productsContainer");
    if (!container) return;
    const filtered = getFilteredProducts();
    if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 60px;">✨ No products match. Try another filter.</div>`;
        return;
    }
    let productHtml = "";
    filtered.forEach(prod => {
        productHtml += `<div class="product-card-apple" data-id="${prod.id}">
            <div class="product-img-apple">
                <img src="https://ik.imagekit.io/0sf7uub8b/SAMURAI-FWORKS/Screenshot%202026-01-20%20124812.png?updatedAt=1768884573239" alt="${prod.name}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">
                <span style="position:absolute;bottom:8px;right:8px;font-size:1.2rem;background:rgba(0,0,0,0.5);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">${prod.image}</span>
            </div>
            <div class="product-info-apple">
                <div class="product-category-apple">${escapeHtml(prod.category)}</div>
                <div class="product-title-apple">${escapeHtml(prod.name)}</div>
                <div class="product-price-apple">₱${prod.price.toFixed(2)}</div>
                <button class="add-to-cart-apple" data-id="${prod.id}"><i class="fas fa-plus-circle"></i> Add to Cart</button>
            </div>
        </div>`;
    });
    container.innerHTML = productHtml;
    document.querySelectorAll('.add-to-cart-apple').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-id'));
            addToCart(id);
        });
    });
}

// Filter & Search functions
function initFilters() {
    document.querySelectorAll('.cat-btn-apple').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn-apple').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-cat');
            renderProducts();
        });
    });
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }
}

// Featured page functions
function loadFeaturedPage() {
    if (isAdmin) return;
    renderFeaturedProducts();
    if (currentUser) {
        if (typeof loadUserCredit === 'function') loadUserCredit();
        if (typeof loadCreditInvestmentHistory === 'function') loadCreditInvestmentHistory();
    }
}

function renderFeaturedProducts() {
    if (isAdmin) return;
    const featuredGrid = document.getElementById("featuredGrid");
    if (!featuredGrid) return;
    const featured = products.filter(p => p.name === "Roman Candle" || p.name === "Sky Rocket" || p.name === "Sparklers Pack");
    featuredGrid.innerHTML = featured.map(prod => `<div class="product-card-apple">
        <div class="product-img-apple">
            <img src="https://ik.imagekit.io/0sf7uub8b/SAMURAI-FWORKS/Screenshot%202026-01-20%20124812.png?updatedAt=1768884573239" alt="${prod.name}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">
        </div>
        <div class="product-info-apple">
            <div class="product-title-apple">${prod.name}</div>
            <div class="product-price-apple">₱${prod.price}</div>
            <button class="add-to-cart-apple" onclick="addToCart(${prod.id})">Add to Cart</button>
        </div>
    </div>`).join('');
}

// Code redemption with loading indicator
let isRedeeming = false;

async function redeemCode() {
    if (!currentUser || isAdmin) {
        showToast("Please login to redeem codes", 1500);
        openAccountModal();
        return;
    }
    
    if (isRedeeming) {
        showToast("Please wait, processing your redemption...", 1500);
        return;
    }
    
    const codeInput = document.getElementById("redemptionCode");
    const code = codeInput.value.trim().toUpperCase();
    const messageDiv = document.getElementById("codeMessage");
    
    if (!code) {
        showToast("Please enter a code", 1500);
        return;
    }
    
    isRedeeming = true;
    const redeemBtn = document.querySelector('#featuredPage .btn-primary-apple');
    const originalBtnText = redeemBtn ? redeemBtn.innerHTML : 'Redeem';
    
    if (redeemBtn) {
        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redeeming...';
    }
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "redeemOneTimeCode");
        formData.append("code", code);
        formData.append("accountId", currentUser.id);
        formData.append("phone", currentUser.phone);
        formData.append("fullName", currentUser.name);
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            currentUser.balance = result.newBalance;
            localStorage.setItem("nova_user", JSON.stringify(currentUser));
            
            messageDiv.innerHTML = `<div class="code-message success">✓ ${result.message}</div>`;
            codeInput.value = "";
            setTimeout(() => { messageDiv.innerHTML = ""; }, 4000);
            
            updateAllBalanceDisplays();
            showToast(result.message, 3000);
            
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else {
            messageDiv.innerHTML = `<div class="code-message error">✗ ${result.message}</div>`;
            setTimeout(() => { messageDiv.innerHTML = ""; }, 3000);
            showToast(result.message, 2500);
        }
    } catch (error) {
        console.error("Redemption error:", error);
        showToast("Redemption failed. Please try again.", 1500);
    } finally {
        isRedeeming = false;
        if (redeemBtn) {
            redeemBtn.disabled = false;
            redeemBtn.innerHTML = originalBtnText;
        }
    }
}